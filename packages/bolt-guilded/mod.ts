import {
	BoltBridgeMessage,
	BoltBridgeMessageArgs,
	BoltPlugin,
	Client
} from './deps.ts';
import { coreToMessage, idTransform, messageToCore } from './messages.ts';

export default class GuildedPlugin extends BoltPlugin {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.5.0';
	constructor(config: { token: string }) {
		super();
		this.bot = new Client(config);
		this.bot.on('debug', (data: unknown) => {
			this.emit('debug', data);
		});
		this.bot.on('messageCreated', async message => {
			const msg = await messageToCore(message, this);
			if (msg) this.emit('messageUpdate', msg);
		});
		this.bot.on('messageUpdated', async message => {
			const msg = await messageToCore(message, this);
			if (msg) this.emit('messageUpdate', msg);
		});
		this.bot.on('messageDeleted', message => {
			this.emit('messageDelete', {
				id: message.id,
				platform: { name: 'guilded', message },
				channel: message.channelId,
				guild: message.serverId
			});
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
	}
	start() {
		this.bot.login();
	}
	stop() {
		this.bot.disconnect();
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
		return {
			id: wh.id,
			token: wh.token || ''
		};
	}
	async bridgeMessage(data: BoltBridgeMessageArgs) {
		if (data.event !== 'messageDelete') {
			const dat = data.data as BoltBridgeMessage;
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
			const senddata = dat.senddata as string | { token: string; id: string };
			if (typeof senddata === 'string') {
				const channel = await this.bot.channels.fetch(data.data.channel);
				const idtrsnd = idTransform({ ...dat, replyto });
				let result;
				if (
					data.event === 'messageCreate' ||
					data.event === 'threadMessageCreate'
				) {
					result = await channel.send(idtrsnd);
				} else {
					result = await this.bot.messages.update(
						data.data.channel,
						dat.id,
						idtrsnd
					);
				}
				return {
					channel: result.channelId,
					id: result.id,
					plugin: 'bolt-guilded',
					senddata
				};
			} else {
				if (
					data.event === 'threadMessageCreate' ||
					data.event === 'messageCreate'
				) {
					const msgd = coreToMessage({ ...dat, replyto });
					const result = await (
						await fetch(
							`https://media.guilded.gg/webhooks/${senddata.id}/${senddata.token}`,
							{
								method: 'POST',
								body: JSON.stringify(msgd)
							}
						)
					).json();
					return {
						channel: result.channelId,
						id: result.id,
						plugin: 'bolt-guilded',
						senddata
					};
				} else {
					return { ...dat.bridgePlatform, id: data.data.id };
				}
			}
		} else {
			await this.bot.messages.delete(data.data.channel, data.data.id);
			return { ...data.data.bridgePlatform, id: data.data.id };
		}
	}
}
