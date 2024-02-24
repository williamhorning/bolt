import {
	bridge_message,
	bridge_message_arguments,
	message,
	bolt_plugin,
	Client,
	Message
} from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';

export default class RevoltPlugin extends bolt_plugin implements bolt_plugin {
	bot: Client;
	token: string;
	name = 'bolt-revolt';
	version = '0.5.5';
	constructor(config: { token: string }) {
		super();
		this.bot = new Client();
		this.token = config.token;
		this.bot.on('messageCreate', async message => {
			if (message.systemMessage) return;
			this.emit('messageCreate', await messageToCore(this, message));
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
	}
	async start() {
		await this.bot.loginBot(this.token);
	}

	isBridged(msg: message<Message>) {
		return Boolean(
			msg.author.id === this.bot.user?.id && msg.platform.message.masquerade
		);
	}

	bridgeSupport = { text: true };

	async createSenddata(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		if (!ch.havePermission('Masquerade')) {
			throw new Error('Please enable masquerade permissions!');
		}
		return ch.id;
	}

	async bridgeMessage(data: bridge_message_arguments) {
		const dat = data.data as bridge_message;
		const channel = await this.bot.channels.fetch(dat.bridgePlatform.channel);
		let replyto;
		try {
			if (dat.replytoId) {
				replyto = await messageToCore(
					this,
					await this.bot.messages.fetch(
						dat.bridgePlatform.channel,
						dat.replytoId
					)
				);
			}
		} catch {
			replyto = undefined;
		}
		const msg = await coreToMessage({ ...dat, replyto }, true);
		const result = await channel.sendMessage(msg);
		return {
			channel: dat.bridgePlatform.channel,
			id: result.id,
			plugin: 'bolt-revolt',
			senddata: dat.bridgePlatform.channel
		};
	}
}
