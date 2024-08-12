import { render } from '@deno/gfm';
import type { message } from '@jersey/lightning';
import { Buffer } from '@nodejs/buffer';
import type { Intent } from 'matrix-appservice-bridge';

export async function to_matrix(
	msg: message,
	upload: Intent['uploadContent'],
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
	}] as Record<string, unknown>[];

	if (edit) {
		events[0]['m.relates_to'] = {
			rel_type: 'm.replace',
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
					Buffer.from(
						await ((await fetch(attachment.file)).arrayBuffer()),
					),
				),
				info: { size: attachment.size * 1000000 },
				'm.relates_to': edit
					? {
						rel_type: 'm.replace',
						event_id:
							edit[msg.attachments?.indexOf(attachment) + 1],
					}
					: undefined,
			});
		}
	}

	return events;
}
