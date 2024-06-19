import {
	Bridge,
	type bridge_channel,
	type lightning,
	type message,
	plugin,
} from './deps.ts';
import { onEvent } from './events.ts';
import { coreToMessage } from './to_matrix.ts';
import { setup_registration } from './setup_registration.ts';

export type MatrixConfig = {
	appserviceUrl: string;
	homeserverUrl: string;
	domain: string;
	port?: number;
	reg_path: string;
};

export class matrix_plugin extends plugin<MatrixConfig> {
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

	// deno-lint-ignore require-await
	async create_bridge(channelId: string) {
		return channelId;
	}

	async create_message(
		msg: message,
		channel: bridge_channel,
		edit?: string,
		reply?: string,
	) {
		// TODO(jersey): fix replying to messaged bridged by bolt-matrix
		const mxid = `lightning-${msg.plugin}_${msg.author.id}`;
		const mxintent = this.bot.getIntentFromLocalpart(mxid);

		// TODO(jersey): fix the intent stuff

		const messages = await coreToMessage(msg, mxintent, reply, edit);

		// TODO(jersey): handle multiple messages (for attachments)
		const result = await mxintent.sendMessage(
			channel.id,
			messages[0],
		);

		return result.event_id;
	}

	async edit_message(
		msg: message,
		channel: bridge_channel,
		edit_id?: string,
		reply_id?: string,
	) {
		return await this.create_message(msg, channel, edit_id, reply_id);
	}

	async delete_message(
		_msg: message,
		channel: bridge_channel,
		delete_id: string,
	) {
		const intent = this.bot.getIntent();
		await intent.botSdkIntent.underlyingClient.redactEvent(
			channel.id,
			delete_id,
			'bridge message deletion',
		);
		return delete_id;
	}
}
