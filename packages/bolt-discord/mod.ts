import {
	Bolt,
	Client,
	bolt_plugin,
	bridge_platform,
	deleted_message,
	message,
	rest,
	socket
} from './_deps.ts';
import { register_commands } from './commands.ts';
import { register_events } from './events.ts';
import { todiscord } from './messages.ts';

export type discord_config = {
	app_id: string;
	token: string;
	slash_cmds?: boolean;
};

export class discord_plugin extends bolt_plugin<discord_config> {
	bot: Client;
	name = 'bolt-discord';
	version = '0.5.7';
	support = ['0.5.5'];

	constructor(bolt: Bolt, config: discord_config) {
		super(bolt, config);
		this.config = config;
		const rest_client = new rest({ version: '10' }).setToken(config.token);
		const gateway = new socket({
			rest: rest_client,
			token: config.token,
			intents: 0 | 33281
		});
		this.bot = new Client({ rest: rest_client, gateway });
		register_events(this);
		register_commands(this.config, this.bot.api, bolt);
		gateway.connect();
	}

	async create_bridge(channel: string) {
		const wh = await this.bot.api.channels.createWebhook(channel, {
			name: 'bolt bridge'
		});
		return { id: wh.id, token: wh.token };
	}

	is_bridged() {
		return 'query' as const;
	}

	async create_message(
		message: message<unknown>,
		bridge: bridge_platform
	): Promise<bridge_platform> {
		const msg = await todiscord(message);
		const senddata = bridge.senddata as { token: string; id: string };
		try {
			const wh = await this.bot.api.webhooks.execute(
				senddata.id,
				senddata.token,
				msg
			);
			return {
				...bridge,
				id: wh.id
			};
		} catch (e) {
			if (e.status === 404) {
				return bridge;
			} else {
				throw e;
			}
		}
	}

	async edit_message(
		message: message<unknown>,
		bridge: bridge_platform & { id: string }
	): Promise<bridge_platform> {
		const msg = await todiscord(message);
		const senddata = bridge.senddata as { token: string; id: string };
		try {
			const wh = await this.bot.api.webhooks.editMessage(
				senddata.id,
				senddata.token,
				bridge.id,
				msg
			);
			return {
				...bridge,
				id: wh.id
			};
		} catch (e) {
			if (e.status === 404) {
				return bridge;
			} else {
				throw e;
			}
		}
	}

	async delete_message(
		_msg: deleted_message<unknown>,
		bridge: bridge_platform & { id: string }
	) {
		const senddata = bridge.senddata as { token: string; id: string };
		try {
			await this.bot.api.webhooks.deleteMessage(
				senddata.id,
				senddata.token,
				bridge.id
			);
			return bridge;
		} catch (e) {
			if (e.status === 404) {
				return bridge;
			} else {
				throw e;
			}
		}
	}
}
