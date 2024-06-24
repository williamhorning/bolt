import type { TimelineEvents } from './deps.ts';
import type { matrix_user, matrix_config } from './matrix_types.ts';

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

    async ensure_user(localpart: string) {
        if (this.user_store.has(localpart)) return;

        if (
            !(await this.request(
                `v3/register/available?username=${
                    encodeURIComponent(localpart)
                }`,
                'GET',
            )).available
        ) return;

        const register_req = await this.request(
            `v3/register`,
            'POST',
            { username: localpart, type: 'm.login.application_service' },
        );

        if (register_req.user_id) return;

        throw new Error(
            `recieved ${register_req.errcode} when registering for ${localpart}`,
            { cause: register_req },
        );
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
        msg: TimelineEvents["m.room.message"],
        user_id?: string,
    ) {
        return (await this.request(
            `v3/rooms/${room_id}/send/m.room.message/${this
                .request_id++}?user_id=${
                user_id ||
                `@${this.cfg.homeserver_localpart}:${this.cfg.homeserver_domain}`
            }`,
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
