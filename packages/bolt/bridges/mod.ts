import { bridge_commands } from './_commands.ts';
import { Bolt } from '../bolt.ts';
import { Collection } from 'mongo';
import { message, deleted_message, log_error, plugin } from '../utils/mod.ts';
import { bridge_document, bridge_platform } from './types.ts';

export class bolt_bridges {
	private bolt: Bolt;
	private bridge_collection: Collection<bridge_document>;
	// TODO: find a better way to do this, maps work BUT don't't scale well
	private bridged_message_id_map = new Map<string, boolean>();

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.bridge_collection = bolt.db.mongo
			.database(bolt.config.mongo_database)
			.collection('bridges');
		this.bolt.on('create_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (this.is_bridged(msg)) return;
			bolt.emit('create_nonbridged_message', msg);
			await this.handle_message(msg, 'create_message');
		});
		this.bolt.on('edit_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (this.is_bridged(msg)) return;
			await this.handle_message(msg, 'edit_message');
		});
		this.bolt.on('delete_message', async msg => {
			await new Promise(res => setTimeout(res, 400));
			await this.handle_message(msg, 'delete_message');
		});
		this.bolt.cmds.set('bridge', bridge_commands(bolt));
	}

	async get_bridge_message(id: string): Promise<bridge_platform[] | null> {
		const rdata = await this.bolt.redis.sendCommand([
			'JSON.GET',
			`bolt-bridge-${id}`
		]);
		if (!rdata) return [] as bridge_platform[];
		return JSON.parse(rdata as string) as bridge_platform[];
	}

	is_bridged(msg: deleted_message<unknown>): boolean {
		const platform = this.bolt.plugins.get(msg.platform.name);
		if (!platform) return false;
		const platsays = platform.is_bridged(msg);
		if (platsays !== 'query') return platsays;
		return Boolean(this.bridged_message_id_map.get(msg.id));
	}

	async get_bridge({
		_id,
		channel
	}: {
		_id?: string;
		channel?: string;
	}): Promise<bridge_document | undefined> {
		const query = {} as Record<string, string>;

		if (_id) {
			query._id = _id;
		}
		if (channel) {
			query['platforms.channel'] = channel;
		}
		return (await this.bridge_collection.findOne(query)) || undefined;
	}

	async update_bridge(bridge: bridge_document): Promise<void> {
		await this.bridge_collection.replaceOne({ _id: bridge._id }, bridge, {
			upsert: true
		});
	}

	private async handle_message(
		msg: message<unknown> | deleted_message<unknown>,
		action: 'create_message' | 'edit_message' | 'delete_message'
	): Promise<void> {
		const bridge_info = await this.get_platforms(msg, action);
		if (!bridge_info) return;

		if (bridge_info.bridge.settings?.realnames === true) {
			if ('author' in msg && msg.author) {
				msg.author.username = msg.author.rawname;
			}
		}

		const data: (bridge_platform & { id: string })[] = [];

		for (const plat of bridge_info.platforms) {
			const { plugin, platform } = await this.get_sane_plugin(plat, action);
			if (!plugin || !platform) continue;

			let dat;

			try {
				dat = await plugin[action](
					{
						...msg,
						replytoid: await this.get_replytoid(msg, platform)
					} as message<unknown>,
					platform
				);
			} catch (e) {
				if (action === 'delete_message') continue;
				const err = await log_error(e, { platform, action });
				try {
					dat = await plugin[action](err.message, platform);
				} catch (e) {
					await log_error(
						new Error(`logging failed for ${err.uuid}`, { cause: e })
					);
					continue;
				}
			}
			this.bridged_message_id_map.set(dat.id!, true);
			data.push(dat as bridge_platform & { id: string });
		}

		for (const i of data) {
			await this.bolt.redis.sendCommand([
				'JSON.SET',
				`bolt-bridge-${i.id}`,
				'$',
				JSON.stringify(data)
			]);
		}

		await this.bolt.redis.sendCommand([
			'JSON.SET',
			`bolt-bridge-${msg.id}`,
			'$',
			JSON.stringify(data)
		]);
	}

	private async get_platforms(
		msg: message<unknown> | deleted_message<unknown>,
		action: 'create_message' | 'edit_message' | 'delete_message'
	) {
		const bridge = await this.get_bridge(msg);
		if (!bridge) return;
		if (
			action !== 'create_message' &&
			bridge.settings?.editing_allowed !== true
		)
			return;

		const platforms =
			action === 'create_message'
				? bridge.platforms.filter(i => i.channel !== msg.channel)
				: await this.get_bridge_message(msg.id);
		if (!platforms || platforms.length < 1) return;
		return { platforms, bridge };
	}

	private async get_replytoid(
		msg: message<unknown> | deleted_message<unknown>,
		platform: bridge_platform
	) {
		let replytoid;
		if ('replytoid' in msg && msg.replytoid) {
			try {
				replytoid = (await this.get_bridge_message(msg.replytoid))?.find(
					i => i.channel === platform.channel && i.plugin === platform.plugin
				)?.id;
			} catch {
				replytoid = undefined;
			}
		}
		return replytoid;
	}

	private async get_sane_plugin(
		platform: bridge_platform,
		action: 'create_message' | 'edit_message' | 'delete_message'
	): Promise<{
		plugin?: plugin<unknown>;
		platform?: bridge_platform & { id: string };
	}> {
		const plugin = this.bolt.plugins.get(platform.plugin);

		if (!plugin || !plugin[action]) {
			await log_error(new Error(`plugin ${platform.plugin} has no ${action}`));
			return {};
		}

		if (!platform.senddata || (action !== 'create_message' && !platform.id))
			return {};

		return { plugin, platform: platform } as {
			plugin: plugin<unknown>;
			platform: bridge_platform & { id: string };
		};
	}
}
