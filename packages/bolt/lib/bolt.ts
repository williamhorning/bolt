import {
	BoltBridgeCommands,
	bridgeBoltMessage,
	bridgeBoltThread,
	getBoltBridgedMessage
} from './bridge/mod.ts';
import { BoltInfoCommands, handleBoltCommand } from './commands/mod.ts';
import { EventEmitter, MongoClient, Redis, connect } from './deps.ts';
import { BoltPluginEvents } from './types.ts';
import { BoltConfig, BoltPlugin, logBoltError } from './utils.ts';

export class Bolt extends EventEmitter<BoltPluginEvents> {
	config: BoltConfig;
	commands = [...BoltInfoCommands, ...BoltBridgeCommands];
	database: string;
	version = '0.5.1';
	plugins: BoltPlugin[] = [];
	mongo = new MongoClient();
	redis?: Redis;
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
				throw await logBoltError(this, {
					message: `This plugin isn't supported by this version of Bolt.`,
					extra: { plugin: plugin.name },
					code: 'PluginNotCompatible'
				});
			}
			this.plugins.push(plugin);
			await plugin.start(this);
			for await (const event of plugin) {
				this.emit(event.name, ...event.value);
			}
			if (plugin?.commands) {
				this.commands.push(...plugin.commands);
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
		this.registerPluginEvents();
	}
	private async dbsetup() {
		try {
			await this.mongo.connect(this.config.database.mongo.connection);
		} catch (e) {
			throw await logBoltError(this, {
				message: `Can't connect to MongoDB`,
				cause: e,
				extra: {},
				code: 'MongoDBConnectFailed'
			});
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
			await logBoltError(this, {
				message: `Can't connect to Redis`,
				cause: e,
				extra: {},
				code: 'RedisConnectFailed'
			});
			this.redis = undefined;
		}
	}
	private registerPluginEvents() {
		// TODO: move all code below to respective folders or do something else
		this.on('messageCreate', async msg => {
			if (await getBoltBridgedMessage(this, msg.id)) return;
			if (msg.content?.startsWith('!bolt')) {
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
			bridgeBoltMessage(this, 'create', msg);
		});
		this.on('messageUpdate', async msg => {
			if (await getBoltBridgedMessage(this, msg.id)) return;
			bridgeBoltMessage(this, 'update', msg);
		});
		this.on('messageDelete', async msg => {
			if (await getBoltBridgedMessage(this, msg.id)) return;
			bridgeBoltMessage(this, 'delete', msg);
		});
		this.on('threadCreate', thread => bridgeBoltThread(this, 'create', thread));
		this.on('threadDelete', thread => bridgeBoltThread(this, 'delete', thread));
	}
}
