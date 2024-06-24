import {
	Bot,
	type bridge_channel,
	type deleted_message,
	type lightning,
	type message,
	parseArgs,
	plugin,
} from './deps.ts';
import { tgtocore } from './messages.ts';

export type telegram_config = {
	token: string;
};

export class telegram_plugin extends plugin<telegram_config, string[]> {
	name = 'bolt-telegram';
	bot: Bot;

	constructor(l: lightning, config: telegram_config) {
		super(l, config);
		this.bot = new Bot(config.token);
		this.register_cmds();
		this.bot.on('message', async (ctx) => {
			const msg = await tgtocore(ctx, config);
			if (!msg) return;
			this.emit('create_message', msg);
		});
		this.bot.on('edited_message', async (ctx) => {
			const msg = await tgtocore(ctx, config);
			if (!msg) return;
			this.emit('edit_message', msg);
		});
		// turns out it's impossible to deal with messages being deleted due to tdlib/telegram-bot-api#286
		this.bot.start();
	}

	private register_cmds() {
		this.bot.command(
			'start',
			(ctx) =>
				ctx.reply(
					"Hey there! Bolt's up and running. Run /help for more info.",
				),
		);
		const cmds = [...this.lightning.commands.keys()];
		this.bot.command(cmds, (ctx) => {
			const cmd = ctx
				.entities()
				.find((e) => e.type === 'bot_command')
				?.text?.replace('/', '') || 'help';
			const rest_of_message = ctx.msg.text.replace(`/${cmd}`, '').trim();
			const args = parseArgs(rest_of_message.split(' '));
			this.emit('run_command', {
				channel: ctx.msg.chat.id.toString(),
				cmd,
				subcmd: (args._[0] as string) || undefined,
				opts: args,
				plugin: 'bolt-telegram',
				reply: async (msg) => {
					// TODO(jersey): find better way to transform content
					await ctx.reply(msg.content || 'no content');
				},
				timestamp: Temporal.Instant.fromEpochSeconds(ctx.msg.date),
			});
		});
	}

	// deno-lint-ignore require-await
	async create_bridge(channel: string) {
		return channel;
	}

	is_bridged() {
		return false;
	}

	async create_message(message: message, bridge: bridge_channel) {
		// TODO(jersey): find better way to transform content
		const result = await this.bot.api.sendMessage(
			bridge.id,
			message.content || 'nocontent',
		);
		return [result.message_id.toString()];
	}

	async edit_message(
		message: message,
		bridge: bridge_channel,
		edit: string[],
	) {
		// TODO(jersey): find better way to transform content
		await this.bot.api.editMessageText(
			bridge.id,
			Number(edit[0]),
			message.content || 'nocontent',
		);
		return edit;
	}

	async delete_message(
		_: deleted_message,
		bridge: bridge_channel,
		message_id: string[],
	) {
		await this.bot.api.deleteMessage(bridge.id, Number(message_id[0]));
		return message_id;
	}
}
