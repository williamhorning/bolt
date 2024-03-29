import type { Collection } from 'mongo';
import type { lightning } from '../../lightning.ts';
import type {
	bridge_document,
	bridge_platform,
	deleted_message
} from '../types.ts';
import { bridge_commands } from './commands.ts';
import { handle_message } from './handle_message.ts';

/** a thing that bridges messages between platforms defined by plugins */
export class bridges {
	/** the parent instance of lightning */
	private l: lightning;
	/** the database collection containing all the bridges */
	private bridge_collection: Collection<bridge_document>;

	/** create a bridge instance and attach to lightning */
	constructor(l: lightning) {
		this.l = l;
		this.bridge_collection = l.mongo
			.database(l.config.mongo_database)
			.collection('bridges');
		l.on('create_message', async msg => {
			await new Promise(res => setTimeout(res, 50));
			if (this.is_bridged(msg)) return;
			l.emit('create_nonbridged_message', msg);
			handle_message(this, this.l, msg, 'create_message');
		});
		l.on('edit_message', async msg => {
			await new Promise(res => setTimeout(res, 50));
			if (this.is_bridged(msg)) return;
			handle_message(this, this.l, msg, 'edit_message');
		});
		l.on('delete_message', async msg => {
			await new Promise(res => setTimeout(res, 250));
			handle_message(this, this.l, msg, 'delete_message');
		});
		l.cmds.set('bridge', bridge_commands(l));
	}

	/** get all the platforms a message was bridged to */
	async get_bridge_message(id: string): Promise<bridge_platform[] | null> {
		const rdata = await this.l.redis.sendCommand([
			'JSON.GET',
			`lightning-bridge-${id}`
		]);
		if (!rdata || rdata == 'OK') return [] as bridge_platform[];
		return JSON.parse(rdata as string) as bridge_platform[];
	}

	/** check if a message was bridged */
	is_bridged(msg: deleted_message<unknown>): boolean {
		try {
			return Boolean(sessionStorage.getItem(msg.id));
		} finally {
			sessionStorage.removeItem(msg.id);
		}
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
