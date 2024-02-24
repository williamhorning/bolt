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

export class Bolt extends EventEmitter<plugin_events> {
	bridge: bolt_bridges;
	cmds = new bolt_commands();
	config: config;
	db: {
		mongo: MongoClient;
		redis: Awaited<ReturnType<typeof connect>>;
		name: string;
	};
	plugins = new Map<string, bolt_plugin>();

	static async setup(cfg: Partial<config>) {
		const config = define_config(cfg);

		Deno.env.set('BOLT_ERROR_HOOK', config.http.errorURL || '');

		const mongo = new MongoClient();

		let redis: Bolt['db']['redis'] | undefined;

		try {
			await mongo.connect(config.database.mongo.connection);
			redis = await connect(config.database.redis);
		} catch (e) {
			await log_error(e, { config });
			Deno.exit(1);
		}

		return new Bolt(config, mongo, redis);
	}

	private constructor(
		config: config,
		mongo: MongoClient,
		redis: Bolt['db']['redis']
	) {
		super();
		this.config = config;
		this.db = { mongo, redis, name: config.database.mongo.database };
		this.bridge = new bolt_bridges(this);
		this.cmds.listen(this);
		this.load(this.config.plugins);
	}

	async load(plugins: bolt_plugin[]) {
		for (const plugin of plugins) {
			if (!plugin.support.includes('0.5.5')) {
				await log_error(
					new Error(`plugin '${plugin.name}' doesn't support bolt 0.5.5`)
				);
				Deno.exit(1);
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
