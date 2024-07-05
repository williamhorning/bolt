import { Hono } from './deps.ts';
import type { telegram_config } from './mod.ts';

export function setup_proxy(cfg: telegram_config) {
    const app = new Hono();

    app.get('/file/*', async (c) => {
        const file_path = c.req.path.replace('/file/', '');
        return await fetch(`https://api.telegram.org/file/bot${cfg.bot_token}/${file_path}`)
    });

    Deno.serve({ port: cfg.plugin_port }, app.fetch);
}
