import { bridge_platform, Client, lightning, message, plugin } from './deps.ts';
import { tocore, torevolt } from './messages.ts';

export class revolt_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-revolt';
	version = '0.6.1';
	support = ['0.6.1'];

	constructor(l: lightning, config: { token: string }) {
		super(l, config);
		this.bot = new Client();
		this.bot.on('messageCreate', message => {
			if (message.systemMessage) return;
			this.emit('create_message', tocore(message));
		});
		this.bot.on('ready', () => {
			this.emit('ready');
		});
		this.bot.loginBot(this.config.token);
	}

	async create_bridge(channel: string) {
		const ch = await this.bot.channels.fetch(channel);
		if (!ch.havePermission('Masquerade')) {
			throw new Error('Please enable masquerade permissions!');
		}
		return ch.id;
	}

	async create_message(msg: message<unknown>, bridge: bridge_platform) {
		const channel = await this.bot.channels.fetch(bridge.channel);
		const result = await channel.sendMessage(await torevolt(msg));
		return {
			...bridge,
			id: result.id
		};
	}

	async edit_message(
		msg: message<unknown>,
		bridge: bridge_platform & { id: string }
	) {
		const message = await this.bot.messages.fetch(bridge.channel, bridge.id);
		await message.edit(await torevolt(msg));
		return bridge;
	}

	async delete_message(
		_msg: message<unknown>,
		bridge: bridge_platform & { id: string }
	) {
		const message = await this.bot.messages.fetch(bridge.channel, bridge.id);
		await message.delete();
		return bridge;
	}
}
