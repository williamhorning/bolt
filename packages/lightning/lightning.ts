import { EventEmitter, RedisClient } from './deps.ts';
import { bridges } from './src/bridges/mod.ts';
import { setup_commands } from './src/commands.ts';
import type { plugin } from './src/plugins.ts';
import type { config, create_plugin, plugin_events } from './src/types.ts';
import { log_error } from './src/utils.ts';

/** an instance of lightning */
export class lightning extends EventEmitter<plugin_events> {
	bridge: bridges;
	/** the config used */
	config: config;
	/** a redis client */
	redis: RedisClient;
	/** the plugins loaded */
	plugins: Map<string, plugin<unknown>> = new Map<string, plugin<unknown>>();

	/** setup an instance with the given config and redis connection */
	constructor(config: config, redis_conn: Deno.TcpConn) {
		super();
		this.config = config;
		this.redis = new RedisClient(redis_conn);
		setup_commands(this);
		this.bridge = new bridges(this);
		this.load(this.config.plugins);
	}

	/** load plugins */
	async load(plugins: create_plugin<plugin<unknown>>[]) {
		for (const p of plugins) {
			if (p.support !== '0.7.0') {
				await log_error(
					new Error(
						`plugin doesn't support this version of lightning, not loading it...`
					)
				);
				continue;
			} else {
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
}
