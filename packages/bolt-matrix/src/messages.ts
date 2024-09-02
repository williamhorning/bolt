import type { message } from '@jersey/lightning';
import type { matrix_client_event } from './matrix_types.ts';
import type { go_functions } from './go_bridge.ts';
import { render } from '@deno/gfm';

export async function to_matrix(
	msg: message,
	upload: go_functions['upload_content'],
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
					await ((await fetch(attachment.file)).blob()),
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

export async function to_lightning(
    matrix: go_functions,
    event: matrix_client_event,
    homeserver_url: string,
): Promise<message> {
    const un_mxc = (url: string) =>
        url.replace('mxc://', `${homeserver_url}/_matrix/media/r0/download/`);
    const sender = await matrix.get_profile_info(event.sender);
    const relates_to = event.content['m.relates_to'] as
        | Record<string, unknown>
        | undefined;
    const message: message = {
        author: {
            id: event.sender,
            rawname: sender.display_name || event.sender,
            username: sender.display_name || event.sender,
            color: '#007A61',
            profile: sender.avatar_url ? un_mxc(sender.avatar_url) : undefined,
        },
        channel: event.room_id,
        id: event.event_id,
        plugin: 'bolt-matrix',
        timestamp: Temporal.Instant.fromEpochMilliseconds(
            event.origin_server_ts,
        ),
        reply_id: relates_to && relates_to['m.in_reply_to']
            ? (relates_to['m.in_reply_to'] as Record<string, string>).event_id
            : undefined,
        reply: async (msg) => {
            await matrix.send({intent: `@bot.lightning:${homeserver_url}`, messages: await to_matrix(
                msg,
                matrix.upload_content,
                event.event_id,
            ), room_id: event.room_id});
        },
    };

    switch (event.content.msgtype as string) {
        case 'm.text':
        case 'm.emote':
        case 'm.notice':
            if (event.content.msgtype === 'm.text') {
                message.content = event.content.body as string;
            } else {
                message.content = `_${event.content.body}_`;
            }
            break;

        case 'm.image':
        case 'm.file':
        case 'm.audio':
        case 'm.video':
        case 'm.voice':
            message.attachments = [{
                name: event.content.filename as string ||
                    event.content.body as string,
                alt: event.content.body as string,
                size: (((event.content.info as
                    | Record<string, unknown>
                    | undefined)?.size ?? 0) as number) / 1000000,
                file: un_mxc(event.content.url as string),
            }];
            break;

        case 'm.location':
            message.content =
                `[${event.content.body}](https://www.google.com/maps/search/?api=1&query=${
                    (event.content.geo_uri as string).split(':')[1]
                })`;
            break;

        default:
            message.content = String(event.content.body);
            break;
    }

    return message;
}
