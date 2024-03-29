import { EventEmitter } from 'event';
import type { MongoClient } from 'mongo';
import { RedisClient } from 'r2d2';
import { bridges } from './src/bridges/mod.ts';
import { commands } from './src/commands.ts';
import type { plugin } from './src/plugins.ts';
import type { config, create_plugin, plugin_events } from './src/types.ts';
import { log_error } from './src/utils.ts';

/** an instance of lightning */
export class lightning extends EventEmitter<plugin_events> {
	bridge: bridges;
	/** a command handler */
	cmds: commands;
	/** the config used */
	config: config;
	/** a mongo client */
	mongo: MongoClient;
	/** a redis client */
	redis: RedisClient;
	/** the plugins loaded */
	plugins: Map<string, plugin<unknown>> = new Map<string, plugin<unknown>>();

	/** setup an instance with the given config, mongo instance, and redis connection */
	constructor(config: config, mongo: MongoClient, redis_conn: Deno.TcpConn) {
		super();
		this.config = config;
		this.mongo = mongo;
		this.redis = new RedisClient(redis_conn);
		this.cmds = new commands(this);
		this.bridge = new bridges(this);
		this.load(this.config.plugins);
	}

	/** load plugins */
	async load(plugins: create_plugin<plugin<unknown>>[]) {
		for (const { type, config } of plugins) {
			const plugin = new type(this, config);
			if (!plugin.support.some(v => v === '0.5.5' || v === '0.6.1')) {
				throw (
					await log_error(
						new Error(
							`plugin '${plugin.name}' doesn't support this version of lightning`
						)
					)
				).e;
			} else {
				this.plugins.set(plugin.name, plugin);
				(async () => {
					for await (const event of plugin) {
						this.emit(event.name, ...event.value);
					}
				})();
			}
		}
	}
}
