import { EventEmitter, RedisClient } from '../deps.ts';
import { setup_bridges } from './bridges/setup_bridges.ts';
import { default_cmds } from "./cmds.ts";
import { setup_commands, type command } from './commands.ts';
import type { create_plugin, plugin, plugin_events } from './plugins.ts';

/** configuration options for lightning */
export interface config {
	/** a list of plugins */
	// deno-lint-ignore no-explicit-any
	plugins?: create_plugin<any>[];
	/** the prefix used for commands */
	cmd_prefix?: string;
	/** the set of commands to use */
	commands?: [string, command][];
	/** the hostname of your redis instance */
	redis_host?: string;
	/** the port of your redis instance */
	redis_port?: number;
	/** the webhook used to send errors to */
	errorURL?: string;
}

/** an instance of lightning */
export class lightning extends EventEmitter<plugin_events> {
	/** the commands registered */
	commands: Map<string, command>;
	/** the config used */
	config: config;
	/** a redis client */
	redis: RedisClient;
	/** the plugins loaded */
	plugins: Map<string, plugin<unknown>>;

	/** setup an instance with the given config and redis connection */
	constructor(config: config, redis_conn: Deno.TcpConn) {
		super();

		this.config = config;
		this.commands = new Map(config.commands || default_cmds);
		this.redis = new RedisClient(redis_conn);
		this.plugins = new Map<string, plugin<unknown>>();

		setup_commands(this);
		setup_bridges(this);

		for (const p of this.config.plugins || []) {
			if (!p.support.includes('0.7.0')) continue;
			const plugin = new p.type(this, p.config);
			this.plugins.set(plugin.name, plugin);
			(async () => {
				for await (const event of plugin) {
					this.emit(event.name, ...event.value);
				}
			})();
		}
	}
}
