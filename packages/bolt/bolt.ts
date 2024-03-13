import { bolt_bridges } from './bridges/mod.ts';
import { bolt_commands } from './cmds/mod.ts';
import { connect, EventEmitter, MongoClient } from './_deps.ts';
import {
	bolt_plugin,
	config,
	define_config,
	log_error,
	plugin_events,
	create_plugin
} from './utils/mod.ts';

export class Bolt extends EventEmitter<plugin_events> {
	bridge: bolt_bridges;
	cmds = new bolt_commands();
	config: config;
	db: {
		mongo: MongoClient;
		redis: Awaited<ReturnType<typeof connect>>;
	};
	plugins = new Map<string, bolt_plugin<unknown>>();

	static async setup(cfg: Partial<config>) {
		const config = define_config(cfg);

		Deno.env.set('BOLT_ERROR_HOOK', config.errorURL || '');

		const mongo = new MongoClient();

		let redis: Bolt['db']['redis'] | undefined;

		try {
			await mongo.connect(config.mongo_uri);
			redis = await connect({
				hostname: config.redis_host,
				port: config.redis_port
			});
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
		this.db = { mongo, redis };
		this.bridge = new bolt_bridges(this);
		this.cmds.listen(this);
		this.load(this.config.plugins);
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
