import { Buffer, type Intent, type message, render } from './deps.ts';

export async function coreToMessage(
	msg: message,
	intent: Intent,
	reply?: string,
	edit?: string,
) {
	const events = [{
		msgtype: 'm.text',
		body: msg.content || '',
		format: 'org.matrix.custom.html',
		formattedBody: render(msg.content || ''),
	}] as Record<string, unknown>[];

	if (reply) {
		events[0]['m.relates_to'] = {
			'm.in_reply_to': {
				event_id: reply,
			},
		};
	}

	if (edit) {
		events[0]['m.relates_to'] = {
			rel_type: 'm.replace',
			event_id: edit,
		};
	}

	for (const attachment of msg.attachments ?? []) {
		events.push({
			msgtype: 'm.file',
			body: attachment.name ?? attachment.alt ?? 'no name file',
			alt: attachment.alt ?? attachment.name ?? 'no alt text',
			file: await intent.uploadContent(Buffer.from(
				await ((await fetch(attachment.file)).arrayBuffer()),
			)),
			info: { size: attachment.size * 1000000 },
		});
	}

	return events;
}
1000000;
