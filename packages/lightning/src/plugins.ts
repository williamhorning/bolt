import { EventEmitter } from '../deps.ts';
import type { lightning } from './lightning.ts';
import type {
	bridge_channel,
	create_plugin,
	deleted_message,
	message,
	plugin_events
} from './types.ts';

/**
 * a plugin for lightning
 */
export abstract class plugin<cfg> extends EventEmitter<plugin_events> {
	/** access the instance of lightning you're connected to */
	lightning: lightning;
	/** access the config passed to you by lightning */
	config: cfg;
	/** the name of your plugin */
	abstract name: string;
	/** the version of your plugin */
	abstract version: string;

	/** create a new plugin instance */
	static new<T extends plugin<unknown>>(
		this: new (l: lightning, config: T['config']) => T,
		config: T['config']
	): create_plugin<T> {
		return { type: this, config, support: '0.7.0' };
	}

	constructor(l: lightning, config: cfg) {
		super();
		this.lightning = l;
		this.config = config;
	}

	/** this should return the data you need to send to the channel given */
	abstract create_bridge(channel: string): Promise<unknown>;

	/** this is used to bridge a NEW message */
	abstract create_message(
		message: message<unknown>,
		channel: bridge_channel,
		edit_id?: string,
		reply_id?: string
	): Promise<string>;

	/** this is used to bridge an EDITED message */
	abstract edit_message(
		message: message<unknown>,
		channel: bridge_channel,
		edit_id: string,
		reply_id?: string
	): Promise<string>;

	/** this is used to bridge a DELETED message */
	abstract delete_message(
		message: deleted_message<unknown>,
		channel: bridge_channel,
		delete_id: string,
		reply_id?: string
	): Promise<string>;
}
