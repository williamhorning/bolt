import { EventEmitter } from 'event';
import { Bolt } from '../bolt.ts';
import { bridge_platform } from '../bridges/types.ts';
import { message, deleted_message } from './messages.ts';
import { command_arguments } from './commands.ts';

/**
 * a plugin for bolt
 */
export abstract class plugin<cfg> extends EventEmitter<plugin_events> {
	/** access the instance of bolt you're connected to */
	bolt: Bolt;
	/** access the config passed to you by bolt */
	config: cfg;

	/** the name of your plugin */
	abstract name: string;
	/** the version of your plugin */
	abstract version: string;
	/** a list of major versions supported by your plugin, should include 0.5 */
	abstract support: string[];

	constructor(bolt: Bolt, config: cfg) {
		super();
		this.bolt = bolt;
		this.config = config;
	}

	/** this should return the data you need to send to the channel given */
	abstract create_bridge(channel: string): Promise<unknown>;

	/** this is used to check whether or not a message is bridged, return query if you don't know for sure */
	abstract is_bridged(message: deleted_message<unknown>): boolean | 'query';

	/** this is used to bridge a NEW message */
	abstract create_message(
		message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform>;

	/** this is used to bridge an EDITED message */
	abstract edit_message(
		new_message: message<unknown>,
		bridge: bridge_platform & { id: string }
	): Promise<bridge_platform>;

	/** this is used to bridge a DELETED message */
	abstract delete_message(
		message: deleted_message<unknown>,
		bridge: bridge_platform & { id: string }
	): Promise<bridge_platform>;
}

export type plugin_events = {
	/** when a message is created */
	create_message: [message<unknown>];
	/** when a command is run (not a text command) */
	create_command: [command_arguments];
	/** when a message isn't already bridged (don't emit outside of core) */
	create_nonbridged_message: [message<unknown>];
	/** when a message is edited */
	edit_message: [message<unknown>];
	/** when a message is deleted */
	delete_message: [deleted_message<unknown>];
	/** when your plugin is ready */
	ready: [];
};

/** the constructor for a plugin */
export interface create_plugin {
	new (bolt: Bolt, config: unknown): plugin<unknown>;
	readonly prototype: plugin<unknown>;
}
