import {
	BoltBridgeMessage,
	BoltBridgeMessageArgs,
	BoltPlugin,
	Client
} from './deps.ts';
import { bridgeLegacy } from './legacybridging.ts';
import { coreToMessage, messageToCore } from './messages.ts';

export default class GuildedPlugin extends BoltPlugin {
	bot: Client;
	name = 'bolt-guilded';
	version = '0.5.3';
	constructor(config: { token: string }) {
		super();
		this.bot = new Client(config);
		this.setupClient(this.bot, config);
	}
	private setupClient(client: Client, config: { token: string }) {
		client.on('debug', (data: unknown) => {
			console.log(data);
			this.emit('debug', data);
		});
		client.on('messageCreated', async message => {
			const msg = await messageToCore(message, this);
			if (msg) this.emit('messageCreate', msg);
		});
		client.on('messageUpdated', async message => {
			const msg = await messageToCore(message, this);
			if (msg) this.emit('messageUpdate', msg);
		});
		client.on('messageDeleted', message => {
			this.emit('messageDelete', {
				id: message.id,
				platform: { name: 'guilded', message },
				channel: message.channelId,
				guild: message.serverId,
				timestamp: new Date(message.deletedAt).getTime()
			});
		});
		client.on('ready', () => {
			this.emit('ready');
		});
		client.ws.emitter.on('exit', info => {
			this.emit('debug', info);
			this.bot = new Client(config);
			this.setupClient(this.bot, config);
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
		switch (data.type) {
			case 'create': {
				const dat = data.data as BoltBridgeMessage & {
					senddata: string | { token: string; id: string };
				};
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
					return await bridgeLegacy.bind(this)(dat, dat.senddata, replyto);
				} else {
					const msgd = coreToMessage({ ...dat, replyto });
					const resp = await fetch(
						`https://media.guilded.gg/webhooks/${dat.senddata.id}/${dat.senddata.token}`,
						{
							method: 'POST',
							body: JSON.stringify(msgd)
						}
					);
					if (resp.status === 404) {
						// if the webhook disappeared, but the channel hasn't, try to legacy send it, which should recreate the webhook
						return await bridgeLegacy.bind(this)(
							dat,
							dat.bridgePlatform.channel,
							replyto
						);
					}
					const result = await resp.json();
					return {
						channel: result.channelId,
						id: result.id,
						plugin: 'bolt-guilded',
						senddata: dat.senddata
					};
				}
			}
			case 'update': {
				// editing is NOT supported
				return { ...data.data.bridgePlatform, id: data.data.id };
			}
			case 'delete': {
				await this.bot.messages.delete(data.data.channel, data.data.id);
				return { ...data.data.bridgePlatform, id: data.data.id };
			}
		}
	}
}
