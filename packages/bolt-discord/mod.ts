import { registerCommands } from './commands.ts';
import {
	Bolt,
	BoltBridgeMessage,
	BoltBridgeMessageArgs,
	BoltBridgeThreadArgs,
	BoltPlugin,
	Client,
	GatewayIntentBits,
	REST,
	WebSocketManager
} from './deps.ts';
import { registerEvents } from './handlers.ts';
import { coreToMessage, messageToCore } from './messages.ts';

type DiscordConfig = {
	appId: string;
	token: string;
	registerSlashCommands?: boolean;
};

export default class DiscordPlugin extends BoltPlugin {
	bot: Client;
	config: DiscordConfig;
	gateway: WebSocketManager;
	rest: REST;
	name = 'bolt-discord';
	version = '0.5.1';
	constructor(config: DiscordConfig) {
		super();
		this.config = config;
		this.rest = new REST({ version: '10' }).setToken(config.token);
		this.gateway = new WebSocketManager({
			rest: this.rest,
			token: config.token,
			intents: 65081 as GatewayIntentBits
		});
		this.bot = new Client({ rest: this.rest, gateway: this.gateway });
	}
	async start(bolt: Bolt) {
		registerEvents(this, bolt);
		await this.gateway.connect();
		if (this.config.registerSlashCommands) {
			registerCommands(this, bolt);
		}
	}
	async stop() {
		await this.gateway.destroy();
	}
	bridgeSupport = {
		text: true,
		threads: true,
		forum: true
	};
	async createSenddata(channel: string) {
		return await this.bot.api.channels.createWebhook(channel, {
			name: 'Bolt Bridge'
		});
	}
	async bridgeMessage(data: BoltBridgeMessageArgs) {
		if (
			data.event === 'messageCreate' ||
			data.event === 'threadMessageCreate' ||
			data.event === 'messageUpdate' ||
			data.event === 'threadMessageUpdate'
		) {
			const dat = data.data as BoltBridgeMessage;
			let replyto;
			try {
				if (dat.replytoId) {
					replyto = await messageToCore(
						this.bot.api,
						await this.bot.api.channels.getMessage(dat.channel, dat.replytoId)
					);
				}
			} catch {
				replyto = undefined;
			}
			const msgd = await coreToMessage({ ...dat, replyto });
			const senddata = dat.senddata as { token: string; id: string };
			let wh;
			if (
				data.event === 'messageCreate' ||
				data.event === 'threadMessageCreate'
			) {
				wh = await this.bot.api.webhooks.execute(
					senddata.id,
					senddata.token,
					msgd
				);
			} else {
				wh = await this.bot.api.webhooks.editMessage(
					senddata.id,
					senddata.token,
					dat.id,
					msgd
				);
			}
			return {
				channel: wh.channel_id,
				id: wh.id,
				plugin: 'bolt-discord',
				senddata,
				thread: dat.threadId
					? {
							id: dat.threadId,
							parent: wh.channel_id
					  }
					: undefined
			};
		} else {
			const msgd = data.data;
			await this.bot.api.channels.deleteMessage(msgd.channel, msgd.id, {
				reason: 'Bridge message deletion'
			});
			return {
				channel: msgd.channel,
				id: msgd.id,
				plugin: 'bolt-discord',
				senddata: msgd.senddata
			};
		}
	}
	async bridgeThread(data: BoltBridgeThreadArgs) {
		if (data.event === 'threadCreate') {
			const channel = await this.bot.api.channels.get(
				data.data.bridgePlatform.channel
			);
			const isForum = channel.type === 15;
			const handler = isForum
				? this.bot.api.channels.createForumThread
				: this.bot.api.channels.createThread;
			const result = await handler(data.data.bridgePlatform.channel, {
				message: { content: '.' },
				name: data.data.name || 'bridged thread',
				type: 11
			});
			return {
				id: result.id,
				parent: data.data.bridgePlatform.channel,
				name: result.name ? result.name : undefined
			};
		} else {
			await this.bot.api.channels.delete(data.data.id);
			return {
				id: data.data.id,
				parent: data.data.parent
			};
		}
	}
}
