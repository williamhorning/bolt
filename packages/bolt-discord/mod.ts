import * as conv from './conv.ts';
import type { deleted_message, lightning, message } from './deps.ts';
import {
	Client,
	GatewayDispatchEvents,
	plugin,
	REST,
	WebSocketManager,
} from './deps.ts';
import * as to from './to.ts';

export type discord_config = {
	app_id: string;
	token: string;
	slash_cmds?: boolean;
};

export class discord_plugin extends plugin<discord_config> {
	bot: Client;
	name = 'bolt-discord';

	constructor(l: lightning, config: discord_config) {
		super(l, config);
		this.config = config;
		this.bot = this.setup_client();
		this.setup_events();
		this.setup_commands();
	}

	private setup_client() {
		const rest = new REST({
			version: '10',
			/* @ts-ignore this works */
			makeRequest: fetch,
		}).setToken(this.config.token);

		const gateway = new WebSocketManager({
			rest,
			token: this.config.token,
			intents: 0 | 33281,
		});

		gateway.connect();

		return new Client({ rest, gateway });
	}

	private setup_events() {
		this.bot.on(GatewayDispatchEvents.MessageCreate, async (msg) => {
			this.emit('create_message', await conv.to_core(msg.api, msg.data));
		});

		this.bot.on(GatewayDispatchEvents.MessageUpdate, async (msg) => {
			this.emit('edit_message', await conv.to_core(msg.api, msg.data));
		});

		this.bot.on(GatewayDispatchEvents.MessageDelete, async (msg) => {
			this.emit('delete_message', await conv.to_core(msg.api, msg.data));
		});

		this.bot.on(GatewayDispatchEvents.InteractionCreate, (interaction) => {
			const cmd = conv.to_command(interaction);
			if (cmd) this.emit('run_command', cmd);
		});
	}

	private setup_commands() {
		if (!this.config.slash_cmds) return;

		this.bot.api.applicationCommands.bulkOverwriteGlobalCommands(
			this.config.app_id,
			[...this.lightning.commands.values()].map((command) => {
				return {
					name: command.name,
					type: 1,
					description: command.description || 'a command',
					options: conv.to_intent_opts(command),
				};
			}),
		);
	}

	create_bridge(channel: string) {
		return to.webhook_on_discord(this.bot.api, channel);
	}

	create_message(
		msg: message,
		bridge: to.channel,
		_?: undefined,
		reply_id?: string,
	): Promise<string> {
		return to.send_to_discord(this.bot.api, msg, bridge, _, reply_id);
	}

	edit_message(
		msg: message,
		bridge: to.channel,
		edit_id: string,
		reply_id?: string,
	): Promise<string> {
		return to.send_to_discord(this.bot.api, msg, bridge, edit_id, reply_id);
	}

	delete_message(_msg: deleted_message, bridge: to.channel, id: string) {
		return to.delete_on_discord(this.bot.api, bridge, id);
	}
}
