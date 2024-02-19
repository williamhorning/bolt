import { bolt_bridges } from './bridges/mod.ts';
import { bolt_commands } from './cmds/mod.ts';
import { connect, EventEmitter, MongoClient } from './deps.ts';
import {
	config,
	define_config,
	bolt_plugin,
	plugin_events,
	log_error
} from './utils/mod.ts';

type Redis = Awaited<ReturnType<typeof connect>>;

export class Bolt extends EventEmitter<plugin_events> {
	bridge: bolt_bridges;
	cmds = new bolt_commands();
	config: config;
	database: string;
	mongo: MongoClient;
	plugins: bolt_plugin[] = [];
	redis: Redis;

	static async setup(cfg: Partial<config>) {
		const config = define_config(cfg);

		Deno.env.set('BOLT_ERROR_HOOK', config.http.errorURL || '');

		const mongo = new MongoClient();
		let redis: Redis | undefined;

		try {
			await mongo.connect(config.database.mongo.connection);
			redis = await connect(config.database.redis);
		} catch (e) {
			await log_error(e, { config });
			Deno.exit(1);
		}

		return new Bolt(config, mongo, redis);
	}

	private constructor(config: config, mongo: MongoClient, redis: Redis) {
		super();
		this.config = config;
		this.mongo = mongo;
		this.redis = redis;
		this.database = config.database.mongo.database;
		this.bridge = new bolt_bridges(this);
		this.cmds.listen(this);
		this.load(this.config.plugins);
	}

	getPlugin(name: string) {
		return this.plugins.find(i => i.name === name);
	}

	async load(plugins: bolt_plugin[]) {
		for (const plugin of plugins) {
			if (plugin.boltversion !== '1') {
				await log_error(
					new Error(`plugin '${plugin.name}' isn't supported by bolt`)
				);
				Deno.exit(1);
			} else {
				this.plugins.push(plugin);
				plugin.start(this);
				(async () => {
					for await (const event of plugin) {
						this.emit(event.name, ...event.value);
					}
				})();
			}
		}
	}
}
