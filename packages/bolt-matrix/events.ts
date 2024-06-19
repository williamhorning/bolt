import type { Request, WeakEvent } from './deps.ts';
import type { matrix_plugin } from './mod.ts';
import { messageToCore } from './to_lightning.ts';

export async function onEvent(
	this: matrix_plugin,
	request: Request<WeakEvent>,
) {
	const event = request.getData();
	const bot = this.bot.getBot();
	const intent = this.bot.getIntent();
	if (
		event.type === 'm.room.member' &&
		event.content.membership === 'invite' &&
		event.state_key === bot.getUserId()
	) {
		try {
			await intent.join(event.room_id);
		} catch (e) {
			console.debug(`Failed to join room ${event.room_id}: ${e}`);
		}
	}
	if (event.type === 'm.room.message' && !event.content['m.new_content']) {
		this.emit(
			'create_message',
			await messageToCore(event, intent, this.config.homeserverUrl),
		);
	}
	if (event.type === 'm.room.message' && event.content['m.new_content']) {
		this.emit(
			'edit_message',
			await messageToCore(event, intent, this.config.homeserverUrl),
		);
	}
	if (event.type === 'm.room.redaction') {
		this.emit('delete_message', {
			id: event.redacts as string,
			plugin: 'bolt-matrix',
			channel: event.room_id,
			timestamp: Temporal.Instant.fromEpochMilliseconds(
				event.origin_server_ts,
			),
		});
	}
}
