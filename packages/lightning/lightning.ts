import { EventEmitter } from 'event';
import { MongoClient } from 'mongo';
import { RedisClient } from 'r2d2';
import { bridges } from './bridges/mod.ts';
import {
	commands,
	config,
	create_plugin,
	log_error,
	plugin,
	plugin_events
} from './utils/mod.ts';

/** an instance of lightning */
export class lightning extends EventEmitter<plugin_events> {
	bridge: bridges;
	/** a command handler */
	cmds: commands = new commands();
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
		this.bridge = new bridges(this);
		this.cmds.listen(this);
		this.load(this.config.plugins);
	}

	/** load plugins */
	async load(plugins: create_plugin<plugin<unknown>>[]) {
		for (const { type, config } of plugins) {
			const plugin = new type(this, config);
			if (!plugin.support.includes('0.5.5') || !plugin.support.includes('0.6.1') {
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
