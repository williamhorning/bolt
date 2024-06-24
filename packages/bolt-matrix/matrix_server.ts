import { Hono } from './deps.ts';
import type {
	matrix_client_event,
	matrix_user,
    matrix_config
} from './matrix_types.ts';

export function start_matrix_server(
    cfg: matrix_config,
    store: Map<string, matrix_user>,
    on_event: (e: matrix_client_event) => Promise<void>,
) {
    const app = new Hono();
    const processed_events = new Set<string>();

    app.use('/_matrix/*', async (c, next) => {
        if (c.req.header()['Authorization'] !== cfg.homeservice_token) {
            return c.json({
                errcode: 'M_FORBIDDEN',
                error: 'for this route, you need to authenticate',
            }, 403);
        } else {
            await next();
        }
    });

    app.put('/_matrix/app/v1/transactions/:txn_id', async (c) => {
        if (processed_events.has(c.req.param('txn_id'))) {
            return c.json({}, 200);
        }

        const body = await c.req.json();

        await on_event(body);

        return c.json({}, 200);
    });

    app.post('/_matrix/app/v1/ping', (c) => {
        return c.json({}, 200);
    });

    app.get('/_matrix/app/v1/users/:user_id', (c) => {
        if (store.has(c.req.param('user_id'))) return c.json({});

        return c.json({
            'errcode': 'dev.williamhorning.lightning.notfound',
            'error': "that user doesn't exist",
        }, 404);
    });

    Deno.serve({
        port: cfg.plugin_port,
    }, app.fetch);
}
