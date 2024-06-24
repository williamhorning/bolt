import type { TimelineEvents } from './deps.ts';
import type { matrix_config, matrix_user } from './matrix_types.ts';

export class appservice {
    cfg: matrix_config;
    request_id = 0;
    user_store: Map<string, matrix_user>;

    constructor(cfg: matrix_config, store: Map<string, matrix_user>) {
        this.cfg = cfg;
        this.user_store = store;
    }

    async request(
        path: string,
        method: string,
        body?: Record<string, unknown> | Blob,
    ) {
        return await (await fetch(
            `${this.cfg.homeserver_url}/_matrix/client/${path}`,
            {
                method,
                body: body
                    ? body instanceof Blob ? body : JSON.stringify(body)
                    : undefined,
                headers: {
                    'Authorization': `Bearer ${this.cfg.appservice_token}`,
                },
            },
        )).json();
    }

    async ensure_user(
        localpart: string,
        display_name?: string,
        avatar_url?: string,
    ) {
        if (this.user_store.has(localpart)) {
            return await this.ensure_profile(
                localpart,
                display_name,
                avatar_url,
            );
        }

        if (
            !(await this.request(
                `v3/register/available?username=${
                    encodeURIComponent(localpart)
                }`,
                'GET',
            )).available
        ) {
            this.user_store.set(localpart, {});
            return await this.ensure_profile(
                localpart,
                display_name,
                avatar_url,
            );
        }

        const register_req = await this.request(
            `v3/register`,
            'POST',
            { username: localpart, type: 'm.login.application_service' },
        );

        if (register_req.user_id) {
            this.user_store.set(localpart, {});
            return await this.ensure_profile(
                localpart,
                display_name,
                avatar_url,
            );
        }

        throw new Error(
            `recieved ${register_req.errcode} when registering for ${localpart}`,
            { cause: register_req },
        );
    }

    async ensure_profile(
        localpart: string,
        displayname?: string,
        avatar_url?: string,
    ) {
        const user = this.user_store.get(localpart) ?? {}

        if (displayname && (displayname !== user.display_name)) {
            await this.request(`v3/profile/${user}/displayname`, "PUT", {
                displayname
            })
            user.display_name = displayname
        }

        if (avatar_url && (avatar_url !== user.avatar_url)) {
            const mxc = await this.upload_content(await (await fetch(avatar_url)).blob())
            await this.request(`v3/profile/${user}/avatar_url`, "PUT", {
                avatar_url: mxc
            })
            user.avatar_mxc = mxc
            user.avatar_url = avatar_url
        }

        this.user_store.set(localpart, user)
    }

    async redact_event(room_id: string, id: string) {
        await this.request(
            `v3/rooms/${room_id}/redact/${id}/${this.request_id++}`,
            'PUT',
            {
                reason: 'bridge message deletion',
            },
        );
    }

    async join_room(room_id: string) {
        await this.request(`v3/join/${room_id}`, 'POST');
    }

    async upload_content(blob: Blob) {
        return (await this.request('v3/upload', 'POST', blob))
            .content_uri as string;
    }

    async send_message(
        room_id: string,
        msg: TimelineEvents['m.room.message'],
        mxid?: string,
    ) {
        mxid = mxid ??
            `@${this.cfg.homeserver_localpart}:${this.cfg.homeserver_domain}`;
        const localpart = mxid.split(':')[0].slice(1);
        await this.ensure_user(localpart);
        return (await this.request(
            `v3/rooms/${room_id}/send/m.room.message/${this
                .request_id++}?user_id=${mxid}`,
            'PUT',
            msg as unknown as Record<string, unknown>,
        )).event_id as string;
    }

    async get_profile_info(user_id: string) {
        return await this.request(
            `v3/profile/${user_id}`,
            'GET',
        ) as matrix_user;
    }
}
