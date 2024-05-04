import type {
	bridge_platform,
	deleted_message,
	lightning,
	message,
} from './deps.ts';
import { Client, WebhookClient, plugin } from './deps.ts';
import { create_webhook } from './guilded.ts';
import { tocore } from './messages.ts';
import { convert_msg } from './guilded.ts';

export class guilded_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.6.1';

	constructor(l: lightning, config: { token: string }) {
		super(l, config);
		this.bot = new Client(config);
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
				platform: { message: del, name: 'bolt-guilded' },
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

	async create_message(message: message<unknown>, platform: bridge_platform) {
		const resp = await new WebhookClient(
			platform.senddata as { token: string; id: string }
		).send(await convert_msg(message, platform.channel, this));

		return {
			channel: resp.channelId,
			id: resp.id,
			plugin: 'bolt-guilded',
			senddata: platform.senddata
		};
	}

	// deno-lint-ignore require-await
	async edit_message(message: message<unknown>, bridge: bridge_platform) {
		return { id: message.id, ...bridge };
	}

	async delete_message(
		_message: deleted_message<unknown>,
		bridge: bridge_platform
	) {
		const msg = await this.bot.messages.fetch(bridge.channel, bridge.id!);

		await msg.delete();

		return bridge;
	}
}
