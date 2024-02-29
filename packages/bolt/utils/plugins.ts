import {
	Bolt,
	EventEmitter,
	command_arguments,
	bridge_platform
} from './_deps.ts';
import { message, deleted_message } from './messages.ts';

export abstract class bolt_plugin<t> extends EventEmitter<plugin_events> {
	config: t;

	/** the name of your plugin (like bolt-discord) */
	abstract name: string;

	/** the version of your plugin (like 0.0.1) */
	abstract version: string;

	/** the versions of bolt your plugin was made for (array of strings like `[0.5.0, 0.5.5]` that only includes breaking releases) */
	abstract support: string[];

	/** constructor */
	// deno-lint-ignore no-unused-vars
	constructor(bolt: Bolt, config: t) {
		super();
		this.config = config;
	}
	/** create data needed to bridge */
	abstract create_bridge(channel: string): Promise<unknown>;

	/** checks if message is bridged */
	abstract is_bridged(message: message<unknown>): boolean | 'query';

	/** bridge a message */
	abstract create_message(
		message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform>;

	/** edit a bridged message */
	abstract edit_message(
		new_message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform>;

	/** delete a bridged message */
	abstract delete_message(
		message: deleted_message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform>;
}

export type plugin_events = {
	create_message: [message<unknown>];
	create_command: [command_arguments];
	create_nonbridged_message: [message<unknown>];
	edit_message: [message<unknown>];
	delete_message: [deleted_message<unknown>];
	ready: [];
};
