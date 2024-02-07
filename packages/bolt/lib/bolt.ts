import { BoltBridges } from './bridge/bridge.ts';
import { BoltCommands } from './commands.ts';
import { EventEmitter, MongoClient, Redis, connect } from './deps.ts';
import {
	BoltPluginEvents,
	BoltEmbed,
	BoltMessage,
	BoltPlugin,
	BoltConfig
} from './mod.ts';

export class Bolt extends EventEmitter<BoltPluginEvents> {
	bridge = new BoltBridges(this);
	cmds = new BoltCommands(this);
	config: BoltConfig;
	database: string;
	mongo = new MongoClient();
	plugins: BoltPlugin[] = [];
	redis?: Redis;
	version = '0.5.5';

	constructor(config: BoltConfig) {
		super();
		this.config = config;
		this.database = config.database.mongo.database;
	}

	getPlugin(name: string) {
		return this.plugins.find(i => i.name === name);
	}

	async load(plugins: BoltPlugin[]) {
		for (const plugin of plugins) {
			if (plugin.boltversion !== '1') {
				await this.logFatalError(
					new Error(`plugin '${plugin.name}' isn't supported by bolt`)
				);
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

	async setup() {
		try {
			await this.mongo.connect(this.config.database.mongo.connection);
		} catch (e) {
			throw await this.logFatalError(e);
		}
		try {
			if (this.config.database.redis) {
				this.redis = await connect(this.config.database.redis);
			} else {
				throw '';
			}
		} catch {
			this.emit(
				'warning',
				'not using Redis, things may slow down or be disabled.'
			);
			this.redis = undefined;
		}
		this.load(this.config.plugins);
	}

	createMsg({
		text,
		embeds,
		uuid
	}: {
		text?: string;
		embeds?: BoltEmbed[];
		uuid?: string;
	}): BoltMessage<undefined> & { uuid?: string } {
		const data = {
			author: {
				username: 'Bolt',
				profile:
					'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
				rawname: 'bolt',
				id: 'bolt'
			},
			text,
			embeds,
			channel: '',
			id: '',
			reply: async () => {},
			timestamp: Date.now(),
			platform: {
				name: 'bolt',
				message: undefined
			},
			uuid
		};
		return data;
	}

	// deno-lint-ignore no-explicit-any
	async logError(e: Error, extra: Record<string, any> = {}) {
		const uuid = crypto.randomUUID();
		console.error(`\x1b[41mBolt Error:\x1b[0m ${uuid}`);
		console.error(e, extra);

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

		return this.createMsg({
			text: `Something went wrong! Check https://williamhorning.dev/bolt/docs/Using/ for help.\n\`${uuid}\``,
			uuid
		});
	}

	async logFatalError(e: Error) {
		await this.logError(e, { note: 'this is a fatal error, exiting' });
		Deno.exit(1);
	}
}
