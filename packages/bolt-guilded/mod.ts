import {
	Bolt,
	Client,
	WebhookPayload,
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
	version = '0.5.8';
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
		this.bot.login();
	}

	async create_bridge(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		const srvwhs = await fetch(
			`https://guilded.gg/api/v1/servers/${ch.serverId}/webhooks`,
			{
				headers: {
					Authorization: `Bearer ${this.config.token}`
				}
			}
		);
		if (!srvwhs.ok)
			throw new Error('Server webhooks not found!', {
				cause: await srvwhs.text()
			});
		const srvhooks = (await srvwhs.json()).webhooks;
		const found_wh = srvhooks.find((wh: WebhookPayload) => {
			if (wh.name === 'Bolt Bridges' && wh.channelId === channel) return true;
			return false;
		});
		if (found_wh && found_wh.token)
			return { id: found_wh.id, token: found_wh.token };
		const new_wh = await fetch(
			`https://guilded.gg/api/v1/servers/${ch.serverId}/webhooks`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.config.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: 'Bolt Bridges',
					channelId: channel
				})
			}
		);
		if (!new_wh.ok) {
			throw new Error('Webhook creation failed!', {
				cause: await new_wh.text()
			});
		}
		const wh = await new_wh.json();
		if (!wh.token) {
			throw new Error('Webhook lacks token!', {
				cause: JSON.stringify(wh)
			});
		}
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
