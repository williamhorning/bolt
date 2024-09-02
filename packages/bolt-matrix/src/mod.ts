import {
	type lightning,
	type message_options,
	plugin,
	type process_result,
} from '@jersey/lightning';
import type { matrix_client_event, matrix_config, matrix_user } from './matrix_types.ts';
import { get_go_functions, type go_functions } from './go_bridge.ts';
import { to_lightning, to_matrix } from './messages.ts';

/** the plugin to use */
export class matrix_plugin extends plugin<matrix_config> {
	name = 'bolt-matrix';
	matrix: go_functions;
	store: Map<string, matrix_user> = new Map();

	constructor(l: lightning, config: matrix_config) {
		super(l, config);
		this.matrix = get_go_functions(
			this.config.appservice_id,
			this.config.plugin_port,
		);
		this.matrix.listen((event) => this.handle_event(event));
	}

	/** handle matrix events */
	private async handle_event(event: matrix_client_event) {
		if (event.type === 'm.room.message' && !event.content['m.new_content']) {
			this.emit(
				'create_message',
				await to_lightning(this.matrix, event, this.config.homeserver_url),
			);
		}
		if (event.type === 'm.room.message' && event.content['m.new_content']) {
			this.emit(
				'edit_message',
				await to_lightning(this.matrix, event, this.config.homeserver_url),
			);
		}
		if (event.type === 'm.room.redaction') {
			this.emit('delete_message', {
				id: event.content.redacts as string,
				plugin: 'bolt-matrix',
				channel: event.room_id,
				timestamp: Temporal.Instant.fromEpochMilliseconds(
					event.origin_server_ts,
				),
			});
		}
	}

	/** create a bridge */
	create_bridge(channelId: string): string {
		return channelId;
	}

	/** processes a message */
	async process_message(opts: message_options): Promise<process_result> {
		try {
			if (opts.action === 'delete') {
				await this.matrix.delete({
					messages: opts.edit_id,
					room_id: opts.channel.id,
				});

				return {
					channel: opts.channel,
					id: opts.edit_id,
				};
			} else {
				const messages = await to_matrix(
					opts.message,
					this.matrix.upload_content,
					opts.reply_id,
					'edit_id' in opts ? opts.edit_id : undefined,
				);

				const mxid =
					`@${this.config.homeserver_prefix}${opts.message.author.id}:${this.config.homeserver_domain}`;

				await this.matrix.provision_user({
					mxid,
					display_name: opts.message.author.username,
					avatar_url: opts.message.author.profile,
				});

				const result = await this.matrix.send({
					intent: mxid,
					messages,
					room_id: opts.channel.id,
				});

				return {
					channel: opts.channel,
					id: result,
				};
			}
		} catch (e) {
			return {
				error: e,
				channel: opts.channel,
				disable: false,
			};
		}
	}
}

export type { matrix_config };
