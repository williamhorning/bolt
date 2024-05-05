import { setEnv, cwd, exit } from "../../deps.ts";
import { lightning } from '../lightning.ts';
import { define_config, log_error } from '../utils.ts';

export async function run(config?: string) {
	try {
		const cfg = define_config(
			(await import(config || `${cwd()}/config.ts`))?.default
		);

		setEnv('LIGHTNING_ERROR_HOOK', cfg.errorURL || '');

		// TODO: find way to make work other places
		const redis = await Deno.connect({
			hostname: cfg.redis_host,
			port: cfg.redis_port || 6379
		});

		new lightning(cfg, redis);
	} catch (e) {
		await log_error(e);
		exit(1);
	}
}
