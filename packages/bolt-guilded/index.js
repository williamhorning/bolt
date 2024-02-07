import { Client, EventEmitter, WebhookClient } from './deps.ts';
import { constructGuildedMsg, constructmsg } from './messages.ts';
import { bridge_legacy } from './legacybridging.ts';

export default class GuildedPlugin extends EventEmitter {
	static name = 'guilded';
	name = 'guilded';

	constructor({ token }) {
		super();
		this.bot = new Client({ token });
		this.bot.on('ready', () => {
			this.emit('ready');
		});
		this.bot.on('messageCreated', async message => {
			this.emit('msgcreate', await constructmsg(message, this.bot));
		});
		this.bot.ws.emitter.on('exit', () => {
			this.bot.ws.connect();
		});
		this.bot.login();
	}

	get userid() {
		return this.bot.user?.id;
	}

	isBridged(msg) {
		if (msg.author.id === this.userid && msg.embeds && !msg.replyto) {
			return true;
		} else {
			return 'query';
		}
	}

	async createSenddata(channel) {
		const ch = await this.bot.channels.fetch(channel);
		const webhook = await this.bot.webhooks.create(ch.serverId, {
			name: 'Bolt Bridges',
			channelId: channel
		});
		return {
			id: webhook.id,
			token: webhook.token || "shouldn't be null"
		};
	}

	async bridgeSend(msg, senddata) {
		if (typeof senddata === 'string') {
			return bridge_legacy(this, msg, senddata, msg.replyto);
		}
		if (senddata.token === "shouldn't be null") {
			throw { response: { status: 404 } };
		}
		const hook = new WebhookClient(senddata);
		const constructed = await constructGuildedMsg(msg);
		const execute = await hook.send(...constructed);
		return {
			channel: execute.channelId,
			platform: 'guilded',
			message: execute.id
		};
	}
}
