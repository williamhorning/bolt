import { registerCommands } from './commands.ts';
import {
	Bolt,
	BoltBridgeMessage,
	BoltBridgeMessageArgs,
	BoltPlugin,
	Client,
	GatewayIntentBits as Intents,
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
	version = '0.5.4';
	constructor(config: DiscordConfig) {
		super();
		this.config = config;
		this.rest = new REST({ version: '10' }).setToken(config.token);
		this.gateway = new WebSocketManager({
			rest: this.rest,
			token: config.token,
			intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent
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
	isBridged() {
		return 'query' as const;
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
		const wh = await this.bot.api.webhooks.execute(
			senddata.id,
			senddata.token,
			msgd
		);

		return {
			channel: wh.channel_id,
			id: wh.id,
			plugin: 'bolt-discord',
			senddata
		};
	}
}
