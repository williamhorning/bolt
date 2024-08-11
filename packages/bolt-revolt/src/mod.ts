import {
	type lightning,
	type message_options,
	plugin,
	type process_result,
} from 'lightning';
import { Client } from 'revolt.js';
import { tocore, torevolt } from './messages.ts';

/** options for the revolt plugin */
export interface revolt_config {
	/** the token to use */
	token: string;
}

/** the plugin to use */
export class revolt_plugin extends plugin<revolt_config> {
	bot: Client;
	name = 'bolt-revolt';

	constructor(l: lightning, config: revolt_config) {
		super(l, config);
		this.bot = new Client();
		// @ts-ignore deno is being weird
		this.bot.on('messageCreate', (message) => {
			if (message.systemMessage) return;
			this.emit('create_message', tocore(message));
		});
		// @ts-ignore deno is being weird
		this.bot.on('messageUpdate', (message) => {
			if (message.systemMessage) return;
			this.emit('edit_message', tocore(message));
		});
		// @ts-ignore deno is being weird
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

	/** create a bridge in the channel */
	async create_bridge(channel: string): Promise<string> {
		const ch = await this.bot.channels.fetch(channel);
		if (!ch.havePermission('Masquerade')) {
			throw new Error('Please enable masquerade permissions!');
		}
		if (!ch.havePermission('ManageMessages')) {
			throw new Error('Please enable manage messages permissions!');
		}
		return ch.id;
	}

	/** process a message in a channel */
	async process_message(opts: message_options): Promise<process_result> {
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
				try {
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
				} catch (e) {
					if (e.response.status === 404) {
						return {
							error: new Error('Channel not found!'),
							channel: opts.channel,
							disable: true,
							plugin: this.name,
						};
					} else if (e.response.status === 403) {
						return {
							error: new Error('Please fix permissions!'),
							channel: opts.channel,
							disable: true,
							plugin: this.name,
						};
					} else {
						throw e;
					}
				}
			}
		} catch (e) {
			return {
				error: e,
				channel: opts.channel,
				plugin: this.name,
				disable: false,
			};
		}
	}
}
