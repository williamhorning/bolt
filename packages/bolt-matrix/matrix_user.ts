import { type Bridge, type Intent, MatrixUser, type message, Buffer } from './deps.ts';

export async function ensure_profile(bot: Bridge, mxintent: Intent, channel_id: string, msg: message) {
    const store = bot.getUserStore()!;

    let store_user = await store.getMatrixUser(mxintent.userId);

    if (!store_user) {
        store_user = new MatrixUser(mxintent.userId);
    }

    if ((store_user.get('avatar') !== msg.author.profile) &&
        msg.author.profile) {
        const mxc = await mxintent.uploadContent(
            Buffer.from(
                await (await fetch(msg.author.profile)).arrayBuffer()
            )
        );
        store_user.set('avatar_mxc', mxc);
    }

    await store.setMatrixUser(store_user);

    await mxintent.setRoomUserProfile(channel_id, {
        avatar_url: store_user.get('avatar_mxc'),
        displayname: msg.author.username,
    });
}