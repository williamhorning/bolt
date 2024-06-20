import {
	Bridge,
	type bridge_channel,
	type lightning,
	type message,
	plugin,
} from './deps.ts';
import { onEvent } from './events.ts';
import { to_matrix } from './to_matrix.ts';
import { setup_registration } from './setup_registration.ts';

export type MatrixConfig = {
	appserviceUrl: string;
	homeserverUrl: string;
	domain: string;
	port?: number;
	reg_path: string;
};

export class matrix_plugin extends plugin<MatrixConfig, string[]> {
	bot: Bridge;
	name = 'bolt-matrix';
	version = '0.7.0';

	constructor(l: lightning, config: MatrixConfig) {
		super(l, config);
		this.bot = new Bridge({
			homeserverUrl: this.config.homeserverUrl,
			domain: this.config.domain,
			registration: this.config.reg_path,
			controller: {
				onEvent: onEvent.bind(this),
			},
			roomStore: './config/roomStore.db',
			userStore: './config/userStore.db',
			userActivityStore: './config/userActivityStore.db',
		});
		setup_registration(config);
		this.bot.run(this.config.port || 8081);
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
		const mxid = `lightning-${msg.plugin}_${msg.author.id}`;
		const mxintent = this.bot.getIntentFromLocalpart(mxid);

		// TODO(jersey): fix the intent stuff

		const messages = await to_matrix(msg, mxintent, reply, edit);

		const msg_ids = []

		for (const message of messages) {
			const result = await mxintent.sendMessage(
				channel.id,
				message,
			);
			msg_ids.push(result.event_id);
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
		const intent = this.bot.getIntent();
		for (const message of ids) {
			await intent.botSdkIntent.underlyingClient.redactEvent(
				channel.id,
				message,
				'bridge message deletion',
			);
		}
		return ids;
	}
}
