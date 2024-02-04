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
		this.bot.on('messageUpdate', async message => {
			this.emit('messageUpdate', await messageToCore(this, message));
		});
		this.bot.on('messageDelete', message => {
			this.emit('messageDelete', {
				id: message.id,
				platform: { name: 'bolt-revolt', message },
				channel: message.channelId,
				timestamp: Date.now()
			});
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
	}
	async start() {
		await this.bot.loginBot(this.token);
	}
	bridgeSupport = { text: true };
	async createSenddata(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		if (!ch.havePermission('Masquerade'))
			throw new Error('Please enable masquerade permissions!');
		return ch.id;
	}
	async bridgeMessage(data: BoltBridgeMessageArgs) {
		switch (data.type) {
			case 'create':
			case 'update': {
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
				} catch {}
				try {
					const msg = await coreToMessage({ ...dat, replyto });
					const result = data.type === 'update'
						? await (await channel.fetchMessage(dat.id)).edit(msg) // TODO
						: await channel.sendMessage(msg);
					return {
						channel: dat.channel,
						id: 'id' in result ? result.id : result._id,
						plugin: 'bolt-revolt',
						senddata: dat.channel
					};
				} catch (e) {
					// TODO: proper error handling
					return {};
				}
			}
			case 'delete': {
				const channel = await this.bot.channels.fetch(data.data.channel);
				await channel.deleteMessages([data.data.id]);
				return { ...data.data.bridgePlatform, id: data.data.id };
			}
		}
	}
}
