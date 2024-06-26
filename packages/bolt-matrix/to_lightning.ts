import type { Intent, message } from './deps.ts';
import { to_matrix } from './to_matrix.ts';
import type { matrix_client_event } from './matrix_types.ts';

export async function to_lightning(
    event: matrix_client_event,
    bot: Intent,
    homeserver_url: string,
): Promise<message> {
    const un_mxc = (url: string) =>
        url.replace('mxc://', `${homeserver_url}/_matrix/media/r0/download/`);
    const sender = await bot.getProfileInfo(event.sender);
    const relates_to = event.content['m.relates_to'] as Record<string, unknown> | undefined;
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
            const replies = await to_matrix(
                msg,
                bot.uploadContent,
                event.event_id,
            );

            for (const reply of replies) {
                await bot.sendMessage(event.room_id as string, reply);
            }
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
