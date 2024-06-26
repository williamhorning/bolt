import {
	Bridge,
	type bridge_channel,
	type lightning,
	MatrixUser,
	type message,
	plugin,
	type UserBridgeStore,
} from './deps.ts';
import { on_event } from './matrix_events.ts';
import { to_matrix } from './to_matrix.ts';
import { setup_registration } from './setup_registration.ts';
import type { matrix_config, matrix_user } from './matrix_types.ts';
import { Buffer } from './deps.ts';

export class matrix_plugin extends plugin<matrix_config, string[]> {
	name = 'bolt-matrix';
	store = new Map<string, matrix_user>();
	br: Bridge;
	st: UserBridgeStore;

	constructor(l: lightning, config: matrix_config) {
		super(l, config);
		setup_registration(config);
		this.br = new Bridge({
			controller: {
				onEvent: (request) => {
					console.log(request.getData())
					on_event.bind(this)(request.getData());
				},
			},
			domain: config.homeserver_domain,
			homeserverUrl: config.homeserver_url,
			registration: config.registration_file,
			userStore: `${config.store_dir}/user.db`,
			roomStore: `${config.store_dir}/room.db`,
			userActivityStore: `${config.store_dir}/activity.db`,
		});
		this.st = this.br.getUserStore()!;
		this.br.run(this.config.plugin_port, undefined, "0.0.0.0")
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
		const bot_intent = this.br.getIntent();

		const messages = await to_matrix(
			msg,
			bot_intent.uploadContent,
			reply,
			edit,
		);

		const msg_ids = [];

		const mxid =
			`@${this.config.homeserver_prefix}${msg.author.id}:${this.config.homeserver_domain}`;

		let matrix_user = await this.st.getMatrixUser(mxid);

		if (!matrix_user) {
			matrix_user = new MatrixUser(mxid);
			await this.br.provisionUser(matrix_user);
		}

		const intent = this.br.getIntent(mxid);

		if (
			msg.author.profile &&
			matrix_user.get('avatar_url') !== msg.author.profile
		) {
			const mxc = await bot_intent.uploadContent(
				Buffer.from(
					await (await fetch(msg.author.profile)).arrayBuffer(),
				),
			);

			await intent.setAvatarUrl(mxc);

			matrix_user.set('avatar_url', msg.author.profile);
		}

		if (matrix_user.getDisplayName() !== msg.author.username) {
			await intent.setDisplayName(msg.author.username);

			matrix_user.setDisplayName(msg.author.username);
		}

		await this.st.setMatrixUser(matrix_user);

		for (const message of messages) {
			msg_ids.push(
				(await intent.sendMessage(channel.id, message)).event_id,
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
			await this.br.getIntent().botSdkIntent.underlyinClient.redactEvent(
				channel.id,
				message,
			);
		}
		return ids;
	}
}
