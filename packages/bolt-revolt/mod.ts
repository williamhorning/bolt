import type {
	bridge_channel,
	deleted_message,
	lightning,
	message
} from './deps.ts';
import { Client, plugin } from './deps.ts';
import { tocore, torevolt } from './messages.ts';

export class revolt_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-revolt';
	version = '0.6.1';

	constructor(l: lightning, config: { token: string }) {
		super(l, config);
		this.bot = new Client();
		this.bot.on('messageCreate', message => {
			if (message.systemMessage) return;
			this.emit('create_message', tocore(message));
		});
		this.bot.on('messageUpdate', message => {
			if (message.systemMessage) return;
			this.emit('edit_message', tocore(message));
		});
		this.bot.on('messageDelete', message => {
			if (message.systemMessage) return;
			this.emit('delete_message', {
				channel: message.channelId,
				id: message.id,
				platform: { message, name: 'bolt-revolt' },
				timestamp: message.editedAt
					? Temporal.Instant.fromEpochMilliseconds(
							message.editedAt?.getUTCMilliseconds()
					  )
					: Temporal.Now.instant()
			});
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

	async create_message(
		msg: message<unknown>,
		bridge: bridge_channel,
		_: undefined,
		replytoid?: string
	) {
		const channel = await this.bot.channels.fetch(bridge.id);
		const result = await channel.sendMessage(
			await torevolt({ ...msg, replytoid })
		);
		return result.id;
	}

	async edit_message(
		msg: message<unknown>,
		bridge: bridge_channel,
		edit_id: string,
		replytoid?: string
	) {
		const message = await this.bot.messages.fetch(bridge.id, edit_id);
		await message.edit(await torevolt({ ...msg, replytoid }));
		return edit_id;
	}

	async delete_message(
		_: deleted_message<unknown>,
		bridge: bridge_channel,
		id: string
	) {
		const message = await this.bot.messages.fetch(bridge.id, id);
		await message.delete();
		return id;
	}
}
