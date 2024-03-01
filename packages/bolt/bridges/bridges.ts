import { bridge_commands } from './_commands.ts';
import {
	Bolt,
	Collection,
	message,
	deleted_message,
	log_error
} from './_deps.ts';
import { bridge_document, bridge_platform } from './types.ts';

export class bolt_bridges {
	private collection: Collection<bridge_document>;
	private bolt: Bolt;

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.bolt.on('create_message', async msg => {
			if (!(await this.get_bridge_message(msg.id))) {
				bolt.emit('create_nonbridged_message', msg);
				this.create_message(msg, 'create_message');
			}
		});
		this.bolt.on('edit_message', async msg => {
			if (!(await this.get_bridge_message(msg.id))) {
				await this.create_message(msg, 'edit_message');
			}
		});
		this.bolt.on('delete_message', async msg => {
			await this.delete_message(msg);
		});
		this.bolt.cmds.set('bridge', bridge_commands(bolt));
		this.collection = bolt.db.mongo
			.database(bolt.config.mongo_database)
			.collection('bridges');
	}

	private async get_platforms(msg: deleted_message<unknown>, a: 'new' | 'not') {
		const bridge = await this.get_bridge(msg);
		if (!bridge) return;
		const p =
			a === 'new'
				? bridge.platforms.filter(i => i.channel !== msg.channel)
				: await this.get_bridge_message(msg.id);
		if (!p || p.length < 1) return;
		return p;
	}

	private async create_message(
		msg: message<unknown>,
		action: 'create_message' | 'edit_message'
	) {
		const data = [];
		const platforms = await this.get_platforms(
			msg,
			action === 'create_message' ? 'new' : 'not'
		);
		if (!platforms) return;

		for (const platform of platforms) {
			const plugin = this.bolt.plugins.get(platform.plugin);
			if (
				!platform.senddata ||
				!plugin ||
				!plugin[action] ||
				(action === 'edit_message' && !platform.id)
			)
				continue;
			try {
				data.push(await plugin[action](msg, platform));
			} catch (e) {
				try {
					data.push(
						await plugin[action](
							(
								await log_error(e, {
									platform,
									action,
									platforms
								})
							).message,
							platform
						)
					);
				} catch (e) {
					await log_error(
						new Error('logging a bridge error failed', { cause: e })
					);
				}
			}
		}

		for (const i of data) {
			await this.bolt.db.redis.set(`message-${i.id}`, JSON.stringify(data));
		}

		await this.bolt.db.redis.set(`message-${msg.id}`, JSON.stringify(data));
	}

	private async delete_message(msg: deleted_message<unknown>) {
		const platforms = await this.get_platforms(msg, 'not');
		if (!platforms) return;

		for (const platform of platforms) {
			const plugin = this.bolt.plugins.get(platform.plugin);
			if (
				!platform.id ||
				!platform.senddata ||
				!plugin ||
				!plugin.delete_message
			)
				continue;
			try {
				await plugin.delete_message(msg, platform);
			} catch (_e) {
				continue;
			}
		}
	}

	async get_bridge_message(id: string) {
		return JSON.parse(
			(await this.bolt.db.redis.get(`message-${id}`)) || 'false'
		) as bridge_platform[] | false;
	}

	async get_bridge({ _id, channel }: { _id?: string; channel?: string }) {
		const query = {} as Record<string, string>;

		if (_id) {
			query._id = _id;
		}
		if (channel) {
			query['platforms.channel'] = channel;
		}
		return (await this.collection.findOne(query)) || undefined;
	}

	async update_bridge(bridge: bridge_document) {
		return await this.collection.replaceOne({ _id: bridge._id }, bridge, {
			upsert: true
		});
	}
}
