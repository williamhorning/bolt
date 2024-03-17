import { bridge_commands } from './_commands.ts';
import { lightning } from '../lightning.ts';
import { Collection } from 'mongo';
import { deleted_message } from '../utils/mod.ts';
import { bridge_document, bridge_platform } from './types.ts';
import { bridge_internals_dont_use_or_look_at } from './_internal.ts';

/** a thing that bridges messages between platforms defined by plugins */
export class bridges {
	/** the parent instance of lightning */
	private l: lightning;
	/** the database collection containing all the bridges */
	private bridge_collection: Collection<bridge_document>;
	/** the scary internals that you never want to look at */
	private internals: bridge_internals_dont_use_or_look_at;

	/** create a bridge instance and attach to lightning */
	constructor(l: lightning) {
		this.l = l;
		this.internals = new bridge_internals_dont_use_or_look_at(this, l);
		this.bridge_collection = l.mongo
			.database(l.config.mongo_database)
			.collection('bridges');
		l.on('create_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (this.is_bridged(msg)) return;
			l.emit('create_nonbridged_message', msg);
			await this.internals.handle_message(msg, 'create_message');
		});
		l.on('edit_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			if (this.is_bridged(msg)) return;
			await this.internals.handle_message(msg, 'edit_message');
		});
		l.on('delete_message', async msg => {
			await new Promise(res => setTimeout(res, 400));
			await this.internals.handle_message(msg, 'delete_message');
		});
		l.cmds.set('bridge', bridge_commands(l));
	}

	/** get all the platforms a message was bridged to */
	async get_bridge_message(id: string): Promise<bridge_platform[] | null> {
		const rdata = await this.l.redis.sendCommand([
			'JSON.GET',
			`lightning-bridge-${id}`
		]);
		if (!rdata) return [] as bridge_platform[];
		return JSON.parse(rdata as string) as bridge_platform[];
	}

	/** check if a message was bridged */
	is_bridged(msg: deleted_message<unknown>): boolean {
		const platform = this.l.plugins.get(msg.platform.name);
		if (!platform) return false;
		const platsays = platform.is_bridged(msg);
		if (platsays !== 'query') return platsays;
		return this.internals.is_bridged_internal(msg);
	}

	/** get a bridge using the bridges name or a channel in it */
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

	/** update a bridge in a database */
	async update_bridge(bridge: bridge_document): Promise<void> {
		await this.bridge_collection.replaceOne({ _id: bridge._id }, bridge, {
			upsert: true
		});
	}
}
