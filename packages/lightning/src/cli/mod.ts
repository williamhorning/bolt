import { parseArgs } from '@std/cli/parse-args';
import { log_error } from '../errors.ts';
import { type config, lightning } from '../lightning.ts';

const _ = parseArgs(Deno.args, {
	string: ['config'],
});

const cmd = _._[0];

if (cmd === 'version') {
	console.log('0.7.4');
} else if (cmd === 'run') {
	const cfg = (await import(_.config || `${Deno.cwd()}/config.ts`))
		?.default as config;

	Deno.env.set('LIGHTNING_ERROR_HOOK', cfg.errorURL || '');

	addEventListener('unhandledrejection', async (e) => {
		if (e.reason instanceof Error) {
			await log_error(e.reason);
		} else {
			await log_error(new Error('global rejection'), {
				extra: e.reason,
			});
		}

		Deno.exit(1);
	});

	addEventListener('error', async (e) => {
		if (e.error instanceof Error) {
			await log_error(e.error);
		} else {
			await log_error(new Error('global error'), { extra: e.error });
		}

		Deno.exit(1);
	});

	try {
		new lightning(
			cfg,
			await Deno.connect({
				hostname: cfg.redis_host || 'localhost',
				port: cfg.redis_port || 6379,
			}),
		);
	} catch (e) {
		await log_error(e);
		Deno.exit(1);
	}
} else if (cmd === 'migrations') {
	import('./migrations.ts');
} else {
	console.log('lightning v0.7.4 - extensible chatbot connecting communities');
	console.log('  Usage: lightning [subcommand] <options>');
	console.log('  Subcommands:');
	console.log('    run: run an of lightning using the settings in config.ts');
	console.log('    migrations: run migration script');
	console.log('    version: shows version');
	console.log('  Options:');
	console.log('    --config <string>: path to config file');
}
