import { BoltMessage, Intent, Request, WeakEvent } from './deps.ts';
import MatrixPlugin from './mod.ts';

export async function onEvent(this: MatrixPlugin, request: Request<WeakEvent>) {
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
			this.emit('debug', `Failed to join room ${event.room_id}: ${e}`);
		}
	}
	if (event.type === 'm.room.message' && !event['m.new_content']) {
		this.emit('messageCreate', await messageToCore(event, intent, this.config.homeserverUrl));
	}
	if (event.type === 'm.room.message' && event['m.new_content']) {
		this.emit('messageUpdate', await messageToCore(event, intent, this.config.homeserverUrl));
	}
	if (event.type === 'm.room.redaction') {
		this.emit('messageDelete', {
			id: event.redacts as string,
			platform: { name: 'bolt-matrix', message: event },
			channel: event.room_id,
			timestamp: event.origin_server_ts
		});
	}
}

export async function messageToCore(
	event: WeakEvent,
	intent: Intent,
	homeserverUrl: String
): Promise<BoltMessage<WeakEvent>> {
	const sender = await intent.getProfileInfo(event.sender);
	return {
		author: {
			username: sender.displayname || event.sender,
			rawname: event.sender,
			id: event.sender,
			profile: `${sender.avatar_url.replace("mxc://", `${homeserverUrl}/_matrix/media/v3/thumbnail/`)}?width=96&height=96&method=scale`
		},
		channel: event.room_id,
		id: event.event_id,
		timestamp: event.origin_server_ts,
		content: event.content.body as string,
		reply: async (msg: BoltMessage<unknown>) => {
			await intent.sendMessage(event.room_id, coreToMessage(msg));
		},
		platform: { name: 'bolt-matrix', message: event }
	};
}

export function coreToMessage(msg: BoltMessage<unknown>) {
	return {
		body: msg.content
			? msg.content
			: "*this bridge doesn't support anything except text at the moment*",
		msgtype: 'm.text'
	};
}
