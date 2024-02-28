import { register_commands } from './slashcmds.ts';
import {
	Bolt,
	bolt_plugin,
	Client,
	REST,
	WebSocketManager,
	message,
	bridge_platform,
	deleted_message
} from './deps.ts';
import { register_events } from './events.ts';
import { coreToMessage } from './messages.ts';

export type discord_config = {
	app_id: string;
	token: string;
	slash_cmds?: boolean;
};

export class discord_plugin extends bolt_plugin<discord_config> {
	bot: Client;
	gateway: WebSocketManager;
	rest: REST;
	name = 'bolt-discord';
	version = '0.5.5';
	support = ['0.5.5'];

	constructor(bolt: Bolt, config: discord_config) {
		super(bolt, config);
		this.config = config;
		this.rest = new REST({ version: '10' }).setToken(config.token);
		this.gateway = new WebSocketManager({
			rest: this.rest,
			token: config.token,
			intents: 0 | 33281
		});
		this.bot = new Client({ rest: this.rest, gateway: this.gateway });
		this.gateway.connect();
		register_events(this);
		register_commands(this.config, this.bot.api, bolt);
	}

	async create_bridge(channel: string) {
		return await this.bot.api.channels.createWebhook(channel, {
			name: 'bolt bridge'
		});
	}

	is_bridged() {
		return 'query' as const;
	}

	async create_message(
		message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform> {
		const msg = await coreToMessage(message);
		const senddata = bridge.senddata as { token: string; id: string };
		const wh = await this.bot.api.webhooks.execute(
			senddata.id,
			senddata.token,
			msg
		);
		return {
			...bridge,
			id: wh.id
		};
	}

	async edit_message(
		message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform> {
		const msg = await coreToMessage(message);
		const senddata = bridge.senddata as { token: string; id: string };
		const wh = await this.bot.api.webhooks.editMessage(
			senddata.id,
			senddata.token,
			message.id,
			msg
		);
		return {
			...bridge,
			id: wh.id
		};
	}

	async delete_message(
		message: deleted_message<unknown>,
		bridge: bridge_platform
	) {
		const senddata = bridge.senddata as { token: string; id: string };
		await this.bot.api.webhooks.deleteMessage(
			senddata.id,
			senddata.token,
			message.id
		);
		return bridge;
	}
}
