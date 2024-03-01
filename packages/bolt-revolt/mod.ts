import {
	Bolt,
	Client,
	Message,
	bolt_plugin,
	bridge_platform,
	message
} from './deps.ts';
import { tocore, torevolt } from './messages.ts';

export class revolt_plugin extends bolt_plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-revolt';
	version = '0.5.5';
	support = ['0.5.5'];

	constructor(bolt: Bolt, config: { token: string }) {
		super(bolt, config);
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

	is_bridged(msg: message<Message>) {
		return Boolean(
			msg.author.id === this.bot.user?.id && msg.platform.message.masquerade
		);
	}

	async create_message(msg: message<unknown>, bridge: bridge_platform) {
		const channel = await this.bot.channels.fetch(bridge.channel);
		const result = await channel.sendMessage(await torevolt(msg));
		return {
			...bridge,
			id: result.id
		};
	}

	async edit_message(msg: message<unknown>, bridge: bridge_platform) {
		const message = await this.bot.messages.fetch(bridge.channel, bridge.id!);
		await message.edit(await torevolt(msg));
		return bridge;
	}

	async delete_message(_msg: message<unknown>, bridge: bridge_platform) {
		const message = await this.bot.messages.fetch(bridge.channel, bridge.id!);
		await message.delete();
		return bridge;
	}
}
