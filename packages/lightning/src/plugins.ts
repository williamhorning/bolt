import { EventEmitter } from '../deps.ts';
import type { bridge_channel } from './bridges/types.ts';
import type { command_arguments } from './commands.ts';
import type { lightning } from './lightning.ts';
import type { deleted_message, message } from './messages.ts';

/** the way to make a plugin */
export interface create_plugin<
	plugin_type extends plugin<plugin_type['config'], string | string[]>,
> {
	/** the actual constructor of the plugin */
	type: new (l: lightning, config: plugin_type['config']) => plugin_type;
	/** the configuration options for the plugin */
	config: plugin_type['config'];
	/** version(s) the plugin supports */
	support: string[];
}

/** the events emitted by a plugin */
export type plugin_events = {
	/** when a message is created */
	create_message: [message];
	/** when a message isn't already bridged (don't emit outside of core) */
	create_nonbridged_message: [message];
	/** when a message is edited */
	edit_message: [message];
	/** when a message is deleted */
	delete_message: [deleted_message];
	/** when a command is run */
	run_command: [Omit<command_arguments, 'lightning'>];
};

/** a plugin for lightning */
export abstract class plugin<cfg, idtype extends string | string[] = string | string[]> extends EventEmitter<plugin_events> {
	/** access the instance of lightning you're connected to */
	lightning: lightning;
	/** access the config passed to you by lightning */
	config: cfg;
	/** the name of your plugin */
	abstract name: string;

	/** create a new plugin instance */
	static new<T extends plugin<T["config"]>>(
		this: new (l: lightning, config: T['config']) => T,
		config: T['config'],
	): create_plugin<T> {
		return { type: this, config, support: ['0.7.1'] };
	}

	constructor(l: lightning, config: cfg) {
		super();
		this.lightning = l;
		this.config = config;
	}

	/** this should return the data you need to send to the channel given */
	abstract create_bridge(channel: string): Promise<unknown> | unknown;

	/** this is used to bridge a NEW message */
	abstract create_message(
		message: message,
		channel: bridge_channel,
		edit_id?: idtype,
		reply_id?: string,
	): Promise<idtype>;

	/** this is used to bridge an EDITED message */
	abstract edit_message(
		message: message,
		channel: bridge_channel,
		edit_id: idtype,
		reply_id?: string,
	): Promise<idtype>;

	/** this is used to bridge a DELETED message */
	abstract delete_message(
		message: deleted_message,
		channel: bridge_channel,
		delete_id: idtype,
		reply_id?: string,
	): Promise<idtype>;
}
