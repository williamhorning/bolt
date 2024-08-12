import { existsSync } from '@std/fs';
import type { matrix_config } from './matrix_types.ts';

export function setup_registration(cfg: matrix_config) {
    if (!existsSync(cfg.registration_file)) {
        const registration = `
as_token: ${cfg.appservice_token}
hs_token: ${cfg.homeservice_token}
id: ${cfg.appservice_id}
namespaces:
users:
  - regex: '@${cfg.homeserver_prefix}-.*'
    exclusive: true
sender_localpart: ${cfg.homeserver_localpart}
rate_limited: false
url: ${cfg.plugin_url}`;
        Deno.writeTextFileSync(cfg.registration_file, registration);
    }
}