import {
	Bot,
	type bridge_channel,
	type deleted_message,
	type lightning,
	type message,
	plugin,
} from './deps.ts';
import { from_telegram } from './telegram_message.ts';
import { from_lightning } from './lightning_message.ts';
import { setup_proxy } from './telegram_file_proxy.ts';

export type telegram_config = {
	/** the token for the bot */
	bot_token: string;
	/** the port the plugins proxy will run on */
	plugin_port: number;
	/** the publically accessible url of the plugin */
	plugin_url: string;
};

export class telegram_plugin extends plugin<telegram_config, string[]> {
	name = 'bolt-telegram';
	bot: Bot;

	constructor(l: lightning, cfg: telegram_config) {
		super(l, cfg);
		this.bot = new Bot(cfg.bot_token);
		this.bot.on('message', async (ctx) => {
			const msg = await from_telegram(ctx, cfg);
			if (!msg) return;
			this.emit('create_message', msg);
		});
		this.bot.on('edited_message', async (ctx) => {
			const msg = await from_telegram(ctx, cfg);
			if (!msg) return;
			this.emit('edit_message', msg);
		});
		// turns out it's impossible to deal with messages being deleted due to tdlib/telegram-bot-api#286
		setup_proxy(cfg);
		this.bot.start();
	}

	create_bridge(channel: string) {
		return channel;
	}

	async create_message(
		message: message,
		bridge: bridge_channel,
		_: undefined,
		reply_id?: string,
	) {
		const content = from_lightning(message);
		const messages = [];

		for (const msg of content) {
			const result = await this.bot.api[msg.function](
				bridge.id,
				msg.value,
				{
					reply_parameters: reply_id
						? {
							message_id: Number(reply_id),
						}
						: undefined,
					parse_mode: 'MarkdownV2',
				},
			);

			messages.push(result.message_id.toString());
		}

		return messages;
	}

	async edit_message(
		message: message,
		bridge: bridge_channel,
		edit: string[],
	) {
		const content = from_lightning(message)[0];

		console.log(Number(edit[0]));

		await this.bot.api.editMessageText(
			bridge.id,
			Number(edit[0]),
			content.value,
			{
				parse_mode: 'MarkdownV2',
			},
		);
		return edit;
	}

	async delete_message(
		_: deleted_message,
		bridge: bridge_channel,
		messages: string[],
	) {
		for (const id of messages) {
			await this.bot.api.deleteMessage(bridge.id, Number(id));
		}

		return messages;
	}
}
