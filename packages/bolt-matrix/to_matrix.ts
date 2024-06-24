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

	if (edit) {
		events[0]['m.relates_to'] = {
			rel_type: "m.replace",
			event_id: edit[0],
		};
	} else if (reply) {
		events[0]['m.relates_to'] = {
			'm.in_reply_to': {
				event_id: reply,
			},
		};
	}

	if (msg.attachments) {
		for (const attachment of msg.attachments) {
			events.push({
				msgtype: 'm.file',
				body: attachment.name ?? attachment.alt ?? 'no name file',
				alt: attachment.alt ?? attachment.name ?? 'no alt text',
				url: await upload(
					await ((await fetch(attachment.file)).blob()),
				),
				info: { size: attachment.size * 1000000 },
				'm.relates_to': edit ? {
					rel_type: 'm.replace',
					event_id: edit[msg.attachments?.indexOf(attachment) + 1],
				} : undefined
			});
		}
	}

	return events;
}
