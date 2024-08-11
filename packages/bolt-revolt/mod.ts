import { type lightning, type message_options, plugin } from 'lightning';
import { Client } from 'revolt.js';
import { tocore, torevolt } from './messages.ts';

export class revolt_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-revolt';

	constructor(l: lightning, config: { token: string }) {
		super(l, config);
		this.bot = new Client();
		this.bot.on('messageCreate', (message) => {
			if (message.systemMessage) return;
			this.emit('create_message', tocore(message));
		});
		this.bot.on('messageUpdate', (message) => {
			if (message.systemMessage) return;
			this.emit('edit_message', tocore(message));
		});
		this.bot.on('messageDelete', (message) => {
			if (message.systemMessage) return;
			this.emit('delete_message', {
				channel: message.channelId,
				id: message.id,
				plugin: 'bolt-revolt',
				timestamp: message.editedAt
					? Temporal.Instant.fromEpochMilliseconds(
						message.editedAt?.getUTCMilliseconds(),
					)
					: Temporal.Now.instant(),
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

	async process_message(opts: message_options) {
		try {
			if (opts.action !== 'create') {
				const message = await this.bot.messages.fetch(
					opts.channel.id,
					opts.edit_id[0],
				);

				if (opts.action === 'edit') {
					await message.edit(
						await torevolt({
							...opts.message,
							reply_id: opts.reply_id,
						}),
					);
				} else if (opts.action === 'delete') {
					await message.delete();
				}

				return {
					id: opts.edit_id,
					channel: opts.channel,
					plugin: this.name,
				};
			} else {
				const result = await (await this.bot.channels.fetch(opts.channel.id))
					.sendMessage(
						await torevolt({
							...opts.message,
							reply_id: opts.reply_id,
						}),
					);

				return {
					id: [result.id],
					channel: opts.channel,
					plugin: this.name,
				};
			}
		} catch (e) {
			// TODO(@williamhorning): handle errors better
			return {
				error: e,
				channel: opts.channel,
				plugin: this.name,
				disable: false,
			};
		}
	}
}
