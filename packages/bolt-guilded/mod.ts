import {
	Bolt,
	Client,
	WebhookClient,
	bolt_plugin,
	bridge_platform,
	deleted_message,
	message
} from './_deps.ts';
import { bridge_legacy } from './legacybridging.ts';
import { tocore, toguilded } from './messages.ts';

export class guilded_plugin extends bolt_plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.5.5';
	support = ['0.5.5'];

	constructor(bolt: Bolt, config: { token: string }) {
		super(bolt, config);
		this.bot = new Client(config);
		this.bot.on('ready', () => {
			this.emit('ready');
		});
		this.bot.on('messageCreated', async message => {
			const msg = await tocore(message, this);
			if (msg) this.emit('create_message', msg);
		});
		this.bot.on('messageUpdated', async message => {
			const msg = await tocore(message, this);
			if (msg) this.emit('create_message', msg);
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
		const ch = await this.bot.channels.fetch(channel);
		const wh = await this.bot.webhooks.create(ch.serverId, {
			name: 'Bolt Bridges',
			channelId: channel
		});
		if (!wh.token) throw new Error('No token!!!');
		return { id: wh.id, token: wh.token };
	}

	is_bridged(msg: message<unknown>) {
		if (msg.author.id === this.bot.user?.id && msg.embeds && !msg.replytoid) {
			return true;
		}
		return 'query';
	}

	async create_message(message: message<unknown>, platform: bridge_platform) {
		if (typeof platform.senddata === 'string') {
			return await bridge_legacy(this, message, platform.senddata);
		} else {
			try {
				const resp = await new WebhookClient(
					platform.senddata as { token: string; id: string }
				).send(toguilded(message));
				return {
					channel: resp.channelId,
					id: resp.id,
					plugin: 'bolt-guilded',
					senddata: platform.senddata
				};
			} catch {
				return await bridge_legacy(this, message, platform.channel);
			}
		}
	}

	// TODO: edit support
	// deno-lint-ignore require-await
	async edit_message(message: message<unknown>, bridge: bridge_platform) {
		return { id: message.id, ...bridge };
	}

	async delete_message(
		_message: deleted_message<unknown>,
		bridge: bridge_platform
	) {
		try {
			const msg = await this.bot.messages.fetch(bridge.channel, bridge.id!);
			await msg.delete();
			return bridge;
		} catch {
			// TODO: better handling
			return bridge;
		}
	}
}
