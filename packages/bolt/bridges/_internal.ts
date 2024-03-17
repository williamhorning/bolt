import { bridges } from './mod.ts';
import { message, deleted_message, log_error, plugin } from '../utils/mod.ts';
import { bridge_platform } from './types.ts';
import { Bolt } from '../bolt.ts';

export class bridge_internals_dont_use_or_look_at {
	private bridges: bridges;
	private bolt: Bolt;
	// TODO: find a better way to do this, maps work BUT don't't scale well
	private bridged_message_id_map = new Map<string, boolean>();

	constructor(bridge: bridges, bolt: Bolt) {
		this.bolt = bolt;
		this.bridges = bridge;
	}

	is_bridged_internal(msg: deleted_message<unknown>): boolean {
		return Boolean(this.bridged_message_id_map.get(msg.id));
	}

	async handle_message(
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
		const bridge = await this.bridges.get_bridge(msg);
		if (!bridge) return;
		if (
			action !== 'create_message' &&
			bridge.settings?.editing_allowed !== true
		)
			return;

		const platforms =
			action === 'create_message'
				? bridge.platforms.filter(i => i.channel !== msg.channel)
				: await this.bridges.get_bridge_message(msg.id);
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
				replytoid = (
					await this.bridges.get_bridge_message(msg.replytoid)
				)?.find(
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
