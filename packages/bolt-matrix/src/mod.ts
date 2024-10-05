import {
	type lightning,
	type message_options,
	plugin,
	type process_result,
} from '@jersey/lightning';
import { Buffer } from '@nodejs/buffer';
import {
	Bridge,
	MatrixUser,
	type UserBridgeStore,
} from 'matrix-appservice-bridge';
import { on_event } from './matrix_events.ts';
import type { matrix_config, matrix_user } from './matrix_types.ts';
import { setup_registration } from './setup_registration.ts';
import { to_matrix } from './to_matrix.ts';

export type { matrix_config }

/** the plugin to use */
export class matrix_plugin extends plugin<matrix_config> {
	name = 'bolt-matrix';
	store: Map<string, matrix_user> = new Map();
	br: Bridge;
	st: UserBridgeStore;

	constructor(l: lightning, config: matrix_config) {
		super(l, config);
		setup_registration(config);
		this.br = new Bridge({
			controller: {
				onEvent: (request) => {
					console.log(request.getData());
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
		this.br.run(this.config.plugin_port, undefined, '0.0.0.0');
	}

	/** create a bridge */
	create_bridge(channelId: string): string {
		return channelId;
	}

	/** processes a message */
	async process_message(opts: message_options): Promise<process_result> {
		try {
			const bot_intent = this.br.getIntent();

			if (opts.action === 'delete') {
				for (const message of opts.edit_id) {
					await bot_intent.botSdkIntent.underlyingClient.redactEvent(
						opts.channel.id,
						message,
					);
				}

				return {
					channel: opts.channel,
					id: opts.edit_id,
					plugin: 'bolt-matrix',
				};
			} else {
				const messages = await to_matrix(
					opts.message,
					bot_intent.uploadContent,
					opts.reply_id,
					'edit_id' in opts ? opts.edit_id : undefined,
				);

				const msg_ids = [];

				const mxid =
					`@${this.config.homeserver_prefix}${opts.message.author.id}:${this.config.homeserver_domain}`;

				let matrix_user = await this.st.getMatrixUser(mxid);

				if (!matrix_user) {
					matrix_user = new MatrixUser(mxid);
					await this.br.provisionUser(matrix_user);
				}

				const intent = this.br.getIntent(mxid);

				if (
					opts.message.author.profile &&
					matrix_user.get('avatar_url') !==
						opts.message.author.profile
				) {
					const mxc = await bot_intent.uploadContent(
						Buffer.from(
							await (await fetch(opts.message.author.profile))
								.arrayBuffer(),
						),
					);

					await intent.setAvatarUrl(mxc);

					matrix_user.set('avatar_url', opts.message.author.profile);
				}

				if (
					matrix_user.getDisplayName() !==
						opts.message.author.username
				) {
					await intent.setDisplayName(opts.message.author.username);

					matrix_user.setDisplayName(opts.message.author.username);
				}

				await this.st.setMatrixUser(matrix_user);

				for (const message of messages) {
					msg_ids.push(
						(await intent.sendMessage(opts.channel.id, message))
							.event_id,
					);
				}

				return {
					channel: opts.channel,
					id: msg_ids,
					plugin: 'bolt-matrix',
				};
			}
		} catch (e) {
			return {
				error: e,
				channel: opts.channel,
				disable: false,
				plugin: 'bolt-matrix',
			};
		}
	}
}
