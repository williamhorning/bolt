import {
	bridge_message_arguments,
	bolt_plugin,
	Client,
	RESTPostWebhookBody,
	WebhookClient
} from './deps.ts';
// import { bridge_legacy } from './legacybridging.ts';
import { coreToMessage, messageToCore } from './messages.ts';

export default class GuildedPlugin extends bolt_plugin {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.5.5';

	constructor(config: { token: string }) {
		super();
		this.bot = new Client(config);
		this.bot.on('debug', (data: unknown) => {
			this.emit('debug', data);
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
		this.bot.on('messageCreated', async message => {
			const msg = await messageToCore(message, this);
			if (msg) this.emit('messageCreate', msg);
		});
		this.bot.ws.emitter.on('exit', () => {
			this.bot.ws.connect();
		});
	}

	start() {
		this.bot.login();
	}

	stop() {
		this.bot.disconnect();
	}

	isBridged(msg) {
		if (msg.author.id === this.bot.user?.id && msg.embeds && !msg.replyto) {
			return true;
		} else {
			return 'query';
		}
	}

	bridgeSupport = {
		text: true
	};

	async createSenddata(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		const wh = await this.bot.webhooks.create(ch.serverId, {
			name: 'Bolt Bridge',
			channelId: channel
		});
		if (!wh.token) throw new Error('No token!');
		return { id: wh.id, token: wh.token };
	}

	async bridgeMessage({
		data: dat
	}: bridge_message_arguments & {
		data: { senddata: string | { id: string; token: string } };
	}) {
		let replyto;
		try {
			if (dat.replytoId) {
				replyto = await messageToCore(
					await this.bot.messages.fetch(dat.channel, dat.replytoId),
					this
				);
			}
		} catch {
			replyto = undefined;
		}
		if (typeof dat.senddata === 'string') {
			throw "can't legacy bridge";
			// return await bridge_legacy(this, dat, dat.senddata, replyto);
		} else {
			const msgd = coreToMessage({ ...dat, replyto });
			try {
				const resp = await new WebhookClient(dat.senddata).send(
					msgd as RESTPostWebhookBody
				);
				return {
					channel: resp.channelId,
					id: resp.id,
					plugin: 'bolt-guilded',
					senddata: dat.senddata
				};
			} catch {
				throw "can't legacy bridge";
				// return await bridge_legacy(
				// 	this,
				// 	dat,
				// 	dat.senddata as unknown as string,
				// 	replyto
				// );
			}
		}
	}
}
