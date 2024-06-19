import type { Intent, message, WeakEvent } from './deps.ts';
import { coreToMessage } from './to_matrix.ts';

export async function to_lightning(
    event: WeakEvent,
    intent: Intent,
    homeserverUrl: string,
): Promise<message> {
    const un_mxc = (url: string) =>
        url.replace('mxc://', `${homeserverUrl}/_matrix/media/r0/download/`);
    const sender = await intent.getProfileInfo(event.sender);

    const message: message = {
        author: {
            id: event.sender,
            rawname: sender.displayname || event.sender,
            username: sender.displayname || event.sender,
            color: '#007A61',
            profile: sender.avatar_url ? un_mxc(sender.avatar_url) : undefined,
        },
        channel: event.room_id,
        id: event.event_id,
        plugin: 'bolt-matrix',
        timestamp: Temporal.Instant.fromEpochMilliseconds(
            event.origin_server_ts,
        ),
        reply_id: event['m.relates_to']
            // @ts-ignore: types suck
            ? event['m.relates_to'].event_id
            : undefined,
        reply: async (msg) => {
            const replies = await coreToMessage(msg, intent, event.event_id);

            for (const reply of replies) {
                intent.sendMessage(event.room_id as string, reply);
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
