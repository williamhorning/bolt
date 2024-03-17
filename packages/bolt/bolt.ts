import { EventEmitter } from 'event';
import { MongoClient } from 'mongo';
import { RedisClient } from 'r2d2';
import { bolt_bridges } from './bridges/mod.ts';
import {
	Commands,
	plugin,
	config,
	create_plugin,
	log_error,
	plugin_events
} from './utils/mod.ts';

export class Bolt extends EventEmitter<plugin_events> {
	bridge: bolt_bridges;
	cmds: Commands = new Commands();
	config: config;
	db: {
		mongo: MongoClient;
	};
	redis: RedisClient;
	plugins: Map<string, plugin<unknown>> = new Map<string, plugin<unknown>>();

	constructor(config: config, mongo: MongoClient, redis_conn: Deno.TcpConn) {
		super();
		this.config = config;
		this.db = { mongo };
		this.redis = new RedisClient(redis_conn);
		this.bridge = new bolt_bridges(this);
	}

	async setup() {
		this.cmds.listen(this);
		await this.load(this.config.plugins);
	}

	async load(plugins: { type: create_plugin; config: unknown }[]) {
		for (const { type, config } of plugins) {
			const plugin = new type(this, config);
			if (!plugin.support.includes('0.5.5')) {
				throw (
					await log_error(
						new Error(`plugin '${plugin.name}' doesn't support bolt 0.5.5`)
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
