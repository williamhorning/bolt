import {
	BoltBridgeMessage,
	BoltBridgeMessageArgs,
	BoltPlugin,
	Client
} from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';

export default class RevoltPlugin extends BoltPlugin {
	bot: Client;
	token: string;
	name = 'bolt-revolt';
	version = '0.5.4';
	constructor(config: { token: string }) {
		super();
		this.bot = new Client();
		this.token = config.token;
		this.bot.on('messageCreate', async message => {
			this.emit('messageCreate', await messageToCore(this, message));
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
	}
	async start() {
		await this.bot.loginBot(this.token);
	}

	isBridged(msg) {
		return msg.author.id === this.bot.user?.id && msg.masquerade;
	}

	bridgeSupport = { text: true };

	async createSenddata(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		if (!ch.havePermission('Masquerade')) {
			throw new Error('Please enable masquerade permissions!');
		}
		return ch.id;
	}

	async bridgeMessage(data: BoltBridgeMessageArgs) {
		const dat = data.data as BoltBridgeMessage;
		const channel = await this.bot.channels.fetch(dat.channel);
		let replyto;
		try {
			if (dat.replytoId) {
				replyto = await messageToCore(
					this,
					await this.bot.messages.fetch(dat.channel, dat.replytoId)
				);
			}
		} catch {
			replyto = undefined;
		}
		try {
			const msg = await coreToMessage({ ...dat, replyto });
			const result = await channel.sendMessage(msg);
			return {
				channel: dat.channel,
				id: result.id,
				plugin: 'bolt-revolt',
				senddata: dat.channel
			};
		} catch (_e) {
			// TODO: proper error handling
			return {
				id: 'error',
				plugin: 'bolt-revolt',
				senddata: dat.channel,
				channel: dat.channel
			};
		}
	}
}
