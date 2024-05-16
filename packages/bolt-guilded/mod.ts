import type {
	bridge_channel,
	deleted_message,
	lightning,
	message
} from './deps.ts';
import { Client, WebhookClient, plugin } from './deps.ts';
import { convert_msg, create_webhook } from './guilded.ts';
import { tocore } from './messages.ts';

export class guilded_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.7.0';

	constructor(l: lightning, c: { token: string }) {
		super(l, c);
		const h = {
			headers: {
				'x-guilded-bot-api-use-official-markdown': 'true'
			}
		};
		this.bot = new Client({ token: c.token, rest: h, ws: h });
		this.setup_events();
		this.bot.login();
	}

	private setup_events() {
		this.bot.on('messageCreated', async message => {
			const msg = await tocore(message, this);
			if (msg) this.emit('create_message', msg);
		});
		this.bot.on('messageUpdated', async message => {
			const msg = await tocore(message, this);
			if (msg) this.emit('edit_message', msg);
		});
		this.bot.on('messageDeleted', del => {
			this.emit('delete_message', {
				channel: del.channelId,
				id: del.id,
				plugin: 'bolt-guilded',
				timestamp: Temporal.Instant.from(del.deletedAt)
			});
		});
		this.bot.ws.emitter.on('exit', () => {
			this.bot.ws.connect();
		});
	}

	async create_bridge(channel: string) {
		return await create_webhook(this.bot, channel, this.config.token);
	}

	async create_message(
		message: message,
		channel: bridge_channel,
		_?: undefined,
		reply_id?: string
	) {
		const { id } = await new WebhookClient(
			channel.data as { token: string; id: string }
		).send(await convert_msg({ ...message, reply_id }, channel.id, this));
		return id;
	}

	// deno-lint-ignore require-await
	async edit_message(_: message, __: bridge_channel, edit_id: string) {
		return edit_id;
	}

	async delete_message(
		_message: deleted_message,
		channel: bridge_channel,
		id: string
	) {
		const msg = await this.bot.messages.fetch(channel.id, id);
		await msg.delete();
		return id;
	}
}
