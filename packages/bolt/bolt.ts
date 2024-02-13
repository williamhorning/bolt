import { bolt_bridges } from './bridges/mod.ts';
import { bolt_commands } from './cmds/mod.ts';
import { connect, EventEmitter, MongoClient, Redis, nanoid } from './deps.ts';
import {
	config,
	define_config,
	bolt_plugin,
	plugin_events,
	create_message
} from './utils/mod.ts';

export class Bolt extends EventEmitter<plugin_events> {
	bridge: bolt_bridges;
	cmds: bolt_commands;
	config: config;
	database: string;
	mongo: MongoClient;
	plugins: bolt_plugin[] = [];
	redis: Redis;

	static async setup(cfg: Partial<config>) {
		const config = define_config(cfg);
		const mongo = new MongoClient();
		try {
			await mongo.connect(config.database.mongo.connection);
		} catch (e) {
			throw new Error(`failed to connect to mongo: ${e}`);
		}
		let redis: Redis | undefined;
		try {
			redis = await connect(config.database.redis);
		} catch (e) {
			throw new Error(`failed to connect to redis: ${e}`);
		}
		return new Bolt(config, mongo, redis);
	}

	private constructor(config: config, mongo: MongoClient, redis: Redis) {
		super();
		this.cmds = new bolt_commands();
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
				await this.logError(
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

	// deno-lint-ignore no-explicit-any
	async logError(e: Error, extra: Record<string, any> = {}) {
		const uuid = nanoid();
		this.emit('error', { ...e, uuid, e, extra });

		if (this.config.http.errorURL) {
			delete extra.msg;

			await fetch(this.config.http.errorURL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					embeds: [
						{
							title: e.message,
							description: `\`\`\`${e.stack}\`\`\`\n\`\`\`js\n${JSON.stringify({
								...extra,
								uuid
							})}\`\`\``
						}
					]
				})
			});
		}

		return create_message({
			text: `Something went wrong!\nCheck [the docs](https://williamhorning.dev/bolt/docs/Using/) for help.\n\`\`\`${e.message}\n${uuid}\`\`\``,
			uuid
		});
	}
}
