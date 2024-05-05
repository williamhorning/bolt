import { lightning } from '../lightning.ts';
import { define_config, log_error } from '../utils.ts';

export async function run(config?: string) {
	try {
		const cfg = define_config(
			(await import(config || `${Deno.cwd()}/config.ts`))?.default
		);

		Deno.env.set('LIGHTNING_ERROR_HOOK', cfg.errorURL || '');

		const redis = await Deno.connect({
			hostname: cfg.redis_host,
			port: cfg.redis_port || 6379
		});

		new lightning(cfg, redis);
	} catch (e) {
		await log_error(e);
		Deno.exit(1);
	}
}
