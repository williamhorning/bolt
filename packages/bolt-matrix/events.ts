import type { matrix_plugin } from './mod.ts';
import { to_lightning } from './to_lightning.ts';
import type { matrix_client_event } from './matrix_types.ts';

export async function on_event(
	this: matrix_plugin,
	event: matrix_client_event
) {
	if (
		event.type === 'm.room.member' &&
		event.content.membership === 'invite' &&
		event.state_key === `@${this.config.homeserver_localpart}:${this.config.homeserver_domain}`
	) {
		try {
			await this.bot.join_room(event.room_id);
		} catch (e) {
			console.debug(`Failed to join room ${event.room_id}: ${e}`);
		}
	}
	if (event.type === 'm.room.message' && !event.content['m.new_content']) {
		this.emit(
			'create_message',
			await to_lightning(event, this.bot, this.config.homeserver_url),
		);
	}
	if (event.type === 'm.room.message' && event.content['m.new_content']) {
		this.emit(
			'edit_message',
			await to_lightning(event, this.bot, this.config.homeserver_url),
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
