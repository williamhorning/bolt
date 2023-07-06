import {
	BoltBridgeCommands,
	bridgeBoltMessage,
	bridgeBoltThread,
	getBoltBridgedMessage
} from './bridge/mod.ts';
import { BoltInfoCommands, handleBoltCommand } from './commands/mod.ts';
import { EventEmitter, MongoClient, connect } from './deps.ts';
import { BoltMessage, BoltPluginEvents, BoltThread } from './types.ts';
import { BoltConfig, BoltPlugin } from './utils.ts';

export class Bolt extends EventEmitter<BoltPluginEvents> {
	config: BoltConfig;
	commands = [...BoltInfoCommands, ...BoltBridgeCommands];
	database: string;
	version = '0.5.0';
	plugins = [] as BoltPlugin[];
	mongo = new MongoClient();
	redis?: Awaited<ReturnType<typeof connect>>;
	constructor(config: BoltConfig) {
		super();
		this.config = config;
		this.database = config.prod ? 'bolt' : 'bolt-canary';
	}
	getPlugin(name: string) {
		return this.plugins.find(i => i.name === name);
	}
	async load(plugins: BoltPlugin[]) {
		for (const plugin of plugins) {
			this.plugins.push(plugin);
			await plugin.start(this);
			if (plugin?.commands) {
				this.commands.push(...plugin.commands);
			}
			for await (const event of plugin) {
				console.log(event);
				this.emit(event.name, ...event.value);
				if (
					event.name.startsWith('message') ||
					event.name.startsWith('threadMessage')
				) {
					const msg = event.value[0] as BoltMessage<unknown>;
					if (await getBoltBridgedMessage(this, msg.id)) return;

					if (
						msg.content?.startsWith('!bolt') &&
						(event.name === 'messageCreate' ||
							event.name === 'threadMessageCreate')
					) {
						handleBoltCommand({
							bolt: this,
							name: msg.content.split(' ')[1],
							reply: msg.reply,
							channel: msg.channel,
							platform: msg.platform.name,
							arg: msg.content.split(' ')[2],
							timestamp: msg.timestamp
						});
					}

					bridgeBoltMessage(
						this,
						event.name as
							| 'messageCreate'
							| 'threadMessageCreate'
							| 'messageUpdate'
							| 'threadMessageUpdate'
							| 'messageDelete',
						msg
					);
				} else if (event.name.startsWith('thread')) {
					bridgeBoltThread(
						this,
						event.name as 'threadCreate' | 'threadDelete',
						event.value[0] as BoltThread
					);
				}
			}
		}
	}
	async unload(plugins: BoltPlugin[]) {
		for (const plugin of plugins) {
			if (plugin.stop) await plugin.stop();
			this.plugins = this.plugins.filter(i => i.name !== plugin.name);
		}
	}
	async setup() {
		await this.dbsetup();
		await this.load(this.config.plugins);
	}
	private async dbsetup() {
		try {
			await this.mongo.connect(this.config.database.mongo);
		} catch (e) {
			throw new Error(`Can't connect to MongoDB: ${e.message}`);
		}
		try {
			if (this.config.database.redis) {
				this.redis = await connect(this.config.database.redis);
			} else {
				this.emit(
					'warning',
					'not using Redis, things may slow down or be disabled.'
				);
			}
		} catch (e) {
			this.emit(
				'error',
				new Error(
					`Can't connect to Redis: ${
						e.message || e
					}. We won't use Redis from here on out.`
				)
			);
			this.redis = undefined;
		}
	}
}
