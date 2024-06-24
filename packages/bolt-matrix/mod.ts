import {
	type bridge_channel,
	type lightning,
	type message,
	plugin,
} from './deps.ts';
import { on_event } from './events.ts';
import { to_matrix } from './to_matrix.ts';
import { setup_registration } from './setup_registration.ts';
import { appservice } from './appservice_api.ts';
import type { matrix_config, matrix_user } from './matrix_types.ts';
import { start_matrix_server } from './matrix_server.ts';

export class matrix_plugin extends plugin<matrix_config, string[]> {
	bot: appservice;
	name = 'bolt-matrix';
	store = new Map<string, matrix_user>();

	constructor(l: lightning, config: matrix_config) {
		super(l, config);
		this.bot = new appservice(config, this.store);
		start_matrix_server(config, this.store, on_event.bind(this));
		setup_registration(config);
	}

	create_bridge(channelId: string) {
		return channelId;
	}

	async create_message(
		msg: message,
		channel: bridge_channel,
		edit?: string[],
		reply?: string,
	) {
		const messages = await to_matrix(
			msg,
			this.bot.upload_content,
			reply,
			edit,
		);
		const msg_ids = [];

		for (const message of messages) {
			msg_ids.push(
				await this.bot.send_message(
					channel.id,
					message,
					`@${this.config.homeserver_prefix}${msg.author.id}:${this.config.homeserver_domain}`,
				),
			);
		}

		return msg_ids;
	}

	async edit_message(
		msg: message,
		channel: bridge_channel,
		edit_id?: string[],
		reply_id?: string,
	) {
		return await this.create_message(msg, channel, edit_id, reply_id);
	}

	async delete_message(
		_msg: message,
		channel: bridge_channel,
		ids: string[],
	) {
		for (const message of ids) {
			await this.bot.redact_event(
				channel.id,
				message,
			);
		}
		return ids;
	}
}
