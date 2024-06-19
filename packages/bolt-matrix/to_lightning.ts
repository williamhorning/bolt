// deno-lint-ignore-file require-await
import {
    type IMatrixMessage,
    type Intent,
    MatrixMessageParser,
    type message,
    type WeakEvent,
} from './deps.ts';
import { coreToMessage } from './to_matrix.ts';

const matrix_parser = new MatrixMessageParser();

export async function messageToCore(
    event: WeakEvent,
    intent: Intent,
    homeserverUrl: string,
): Promise<message> {
    const un_mxc = (url: string) =>
        url.replace('mxc://', `${homeserverUrl}/_matrix/media/v3/thumbnail/`);
    const evcontent = event.content as unknown as IMatrixMessage;
    const content = await matrix_parser.FormatMessage({
        callbacks: {
            canNotifyRoom: async () => true,
            getChannelId: async (mxid) => mxid,
            getEmoji: async () => null,
            getUserId: async (mxid) => mxid,
            mxcUrlToHttp: un_mxc,
        },
        displayname: '',
    }, evcontent);
    const sender = await intent.getProfileInfo(event.sender)
    return {
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
        content,
        reply_id: event['m.relates_to']
            // @ts-ignore: types suck
            ? event['m.relates_to'].event_id
            : undefined,
        reply: async (message) => {
            intent.sendMessage(
                event.room_id,
                await coreToMessage(
                    message,
                    event.room_id,
                    intent.botSdkIntent.userId,
                    event.event_id,
                ),
            );
        },
        attachments: [],
    };
}
