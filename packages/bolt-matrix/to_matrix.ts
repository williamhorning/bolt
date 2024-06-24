import {
	type message,
	render,
	type TimelineEvents,
} from './deps.ts';
import type { appservice } from './appservice_api.ts';

export async function to_matrix(
	msg: message,
	upload: appservice['upload_content'],
	reply?: string,
	edit?: string[],
) {
	let content = msg.content || '';

	if (msg.embeds && msg.embeds.length > 0) {
		content += '\n*this message includes embeds*';
	}

	const events = [{
		msgtype: 'm.text',
		body: content,
		format: 'org.matrix.custom.html',
		formatted_body: render(content),
	}] as (TimelineEvents["m.room.message"])[];

	if (reply) {
		events[0]['m.relates_to'] = {
			'm.in_reply_to': {
				event_id: reply,
			},
		};
	} else if (edit) {
		events[0]['m.relates_to'] = {
			rel_type: "m.replace",
			event_id: edit[0],
		};
	}

	if (msg.attachments) {
		for (const attachment of msg.attachments) {
			const file = {
				msgtype: 'm.file',
				body: attachment.name ?? attachment.alt ?? 'no name file',
				alt: attachment.alt ?? attachment.name ?? 'no alt text',
				file: await upload(
					await ((await fetch(attachment.file)).blob()),
				),
				info: { size: attachment.size * 1000000 },
			} as Record<string, unknown>;
			if (edit) {
				file['m.relates_to'] = {
					rel_type: 'm.replace',
					event_id: edit[msg.attachments?.indexOf(attachment) + 1],
				};
			}
		}
	}

	return events;
}
