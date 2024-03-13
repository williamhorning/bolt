import {
	Bolt,
	bolt_plugin,
	bridge_platform,
	message,
	deleted_message,
	Bot,
	parseArgs
} from './_deps.ts';
import { tgtocore } from './messages.ts';

export type telegram_config = {
	token: string;
};

export class telegram_plugin extends bolt_plugin<telegram_config> {
	name = 'bolt-telegram';
	version = '0.5.6';
	support = ['0.5.5'];
	bot: Bot;

	constructor(bolt: Bolt, config: telegram_config) {
		super(bolt, config);
		this.bot = new Bot(config.token);
		this.register_cmds();
		this.bot.on('message', async ctx => {
			const msg = await tgtocore(ctx, config);
			if (!msg) return;
			this.emit('create_message', msg);
		});
		this.bot.on('edited_message', async ctx => {
			const msg = await tgtocore(ctx, config);
			if (!msg) return;
			this.emit('edit_message', msg);
		});
		// turns out it's impossible to deal with messages being deleted due to tdlib/telegram-bot-api#286
		this.bot.start({
			onStart: () => {
				this.emit('ready');
			}
		});
	}

	private register_cmds() {
		this.bot.command('start', ctx =>
			ctx.reply("Hey there! Bolt's up and running. Run /help for more info.")
		);
		const cmds = [...this.bolt.cmds.keys()];
		this.bot.command(cmds, ctx => {
			const cmd =
				ctx
					.entities()
					.find(e => e.type === 'bot_command')
					?.text?.replace('/', '') || 'help';
			const rest_of_message = ctx.msg.text.replace(`/${cmd}`, '').trim();
			const args = parseArgs(rest_of_message.split(' '));
			this.emit('create_command', {
				channel: ctx.msg.chat.id.toString(),
				cmd,
				subcmd: (args._[0] as string) || undefined,
				opts: args,
				platform: 'bolt-telegram',
				replyfn: async msg => {
					// TODO: find better way to transform content
					await ctx.reply(msg.content || 'no content');
				},
				timestamp: Temporal.Instant.fromEpochSeconds(ctx.msg.date)
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

	async create_message(message: message<unknown>, bridge: bridge_platform) {
		// TODO: find better way to transform content
		const result = await this.bot.api.sendMessage(
			bridge.channel,
			message.content || 'nocontent'
		);
		return {
			id: result.message_id.toString(),
			...bridge
		};
	}

	async edit_message(
		message: message<unknown>,
		bridge: bridge_platform & { id: string }
	) {
		// TODO: find better way to transform content
		await this.bot.api.editMessageText(
			bridge.channel,
			Number(bridge.id),
			message.content || 'nocontent'
		);
		return bridge;
	}

	async delete_message(
		_message: deleted_message<unknown>,
		bridge: bridge_platform & { id: string }
	) {
		await this.bot.api.deleteMessage(bridge.channel, Number(bridge.id));
		return bridge;
	}
}
