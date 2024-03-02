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
		this.collection = bolt.db.mongo
			.database(bolt.config.mongo_database)
			.collection('bridges');
		// the delays below are to make sure redis stuff is set
		this.bolt.on('create_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (await this.is_bridged(msg)) return;
			bolt.emit('create_nonbridged_message', msg);
			this.create_message(msg, 'create_message');
		});
		this.bolt.on('edit_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (await this.is_bridged(msg)) return;
			this.create_message(msg, 'edit_message');
		});
		this.bolt.on('delete_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			await this.delete_message(msg);
		});
		this.bolt.cmds.set('bridge', bridge_commands(bolt));
	}

	private async get_platforms(
		msg: deleted_message<unknown>,
		a: 'new' | 'not' | 'del'
	) {
		const bridge = await this.get_bridge(msg);
		if (!bridge) return;
		const p =
			a === 'new'
				? bridge.platforms.filter(i => i.channel !== msg.channel)
				: ((await this.get_bridge_message(
						a === 'not'
							? msg.id
							: ((await this.bolt.db.redis.get(`msg-b-${msg.id}`)) as string)
				  )) as bridge_platform[]);
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
			let dat;
			try {
				let replytoid;
				if (msg.replytoid) {
					try {
						replytoid = (
							(await this.get_bridge_message(
								msg.replytoid
							)) as bridge_platform[]
						).find(
							i =>
								i.channel === platform.channel && i.plugin === platform.plugin
						)?.id;
					} catch {
						replytoid = undefined;
					}
				}
				dat = await plugin[action](
					{ ...msg, replytoid },
					platform as bridge_platform & { id: string }
				);
			} catch (e) {
				try {
					dat = await plugin[action](
						(
							await log_error(e, {
								platform,
								action
							})
						).message,
						platform as bridge_platform & { id: string }
					);
				} catch (e) {
					await log_error(
						new Error('logging a bridge error failed', { cause: e })
					);
					continue;
				}
			}
			await this.bolt.db.redis.set(`msg-b-${dat.id}`, msg.id);
			data.push(dat);
		}

		await this.bolt.db.redis.set(`msg-b-${msg.id}`, msg.id);
		await this.bolt.db.redis.set(`message-${msg.id}`, JSON.stringify(data));
	}

	private async delete_message(msg: deleted_message<unknown>) {
		const platforms = await this.get_platforms(msg, 'del');
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
				await plugin.delete_message(
					msg,
					platform as bridge_platform & { id: string }
				);
			} catch (_e) {
				continue;
			}
		}
	}

	async get_bridge_message(id: string) {
		const redis_data = await this.bolt.db.redis.get(`message-${id}`);
		if (redis_data === null) return [] as bridge_platform[];
		try {
			const data = JSON.parse(redis_data);
			return data as bridge_platform[];
		} catch {
			return redis_data;
		}
	}

	async is_bridged(msg: deleted_message<unknown>) {
		const platform = this.bolt.plugins.get(msg.platform.name);
		if (!platform) return false;
		const platsays = platform.is_bridged(msg);
		if (platsays !== 'query') return platsays;
		return Boolean(await this.bolt.db.redis.get(`msg-b-${msg.id}`));
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

export * from './types.ts';
