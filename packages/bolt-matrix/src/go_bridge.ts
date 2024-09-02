import type {
    lightning_delete_body,
    lightning_send_body,
    matrix_client_event,
	matrix_user,
} from './matrix_types.ts';

export function get_go_functions(
    go_url: string,
    listen_port: number,
): go_functions {
    const fn = {
        async get_profile_info(id: string) {
            const resp = await fetch(`${go_url}/_lightning/profile?mxid=${id}`);

            if (!resp.ok) {
                throw new Error(`failed to get profile info`, {
                    cause: await resp.json(),
                });
            }

            return await resp.json();
        },
        async upload_content(file: Blob) {
            const resp = await fetch(`${go_url}/_lightning/upload`, {
                method: 'POST',
                body: file,
            });
            
            if (!resp.ok) {
                throw new Error(`failed to upload content`, {
                    cause: await resp.json(),
                });
            }

            return await resp.text();
        },
        async provision_user(user: matrix_user) {
            const stored_name = localStorage.getItem(`mxid-name-${user.mxid}`)
            const stored_avatar = localStorage.getItem(`mxid-avatar-${user.mxid}`)

            if (stored_name === user.display_name && stored_avatar === user.avatar_url) {
                return
            }

            let avatar_mxc

            if (stored_avatar !== user.avatar_url && user.avatar_url) {
                avatar_mxc = await fn.upload_content(await (await fetch(user.avatar_url)).blob())
            }

            user.avatar_mxc = avatar_mxc

            await fetch(`${go_url}/_lightning/provision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            });
        },
        async send(body: lightning_send_body) {
            const resp = await fetch(`${go_url}/_lightning/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!resp.ok) {
                throw new Error(`failed to send message`, {
                    cause: await resp.json(),
                });
            }

            return await resp.json() as string[];
        },
        async delete(body: lightning_delete_body) {
            const resp = await fetch(`${go_url}/_lightning/messages`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!resp.ok) {
                throw new Error(`failed to delete message`, {
                    cause: await resp.json(),
                });
            }
        },
        listen(cb: (ev: matrix_client_event) => void | Promise<void>) {
            Deno.serve(
                { port: listen_port },
                async (req) => {
                    if (req.method !== 'POST') {
                        return new Response('method not allowed', {
                            status: 405,
                        });
                    }

                    try {
                        const ev = await req.json() as matrix_client_event;

                        try {
                            await cb(ev);

                            return new Response('ok');
                        } catch {
                            return new Response(`failed to process event`);
                        }
                    } catch {
                        return new Response('bad request', { status: 400 });
                    }
                },
            );
        },
    };

    return fn;
}

export interface go_functions {
    get_profile_info(id: string): Promise<matrix_user>;
    upload_content(file: Blob): Promise<string>;
    provision_user(user: matrix_user): Promise<void>;
    send(body: lightning_send_body): Promise<string[]>;
    delete(body: lightning_delete_body): Promise<void>;
    listen(cb: (ev: matrix_client_event) => void | Promise<void>): void;
}
