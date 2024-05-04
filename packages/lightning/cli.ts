import { parseArgs } from './deps.ts';
import { lightning } from './lightning.ts';
import { define_config, log_error } from './src/utils.ts';

function log(text: string, color?: string, type?: 'error' | 'log') {
	console[type || 'log'](`%c${text}`, `color: ${color || 'white'}`);
}

const args = parseArgs(Deno.args, {
	string: ['config']
});

switch (args._[0]) {
	case 'version': {
		log('0.6.0');
		break;
	}
	case 'run': {
		try {
			const cfg = define_config(
				(await import(args.config || `${Deno.cwd()}/config.ts`))?.default
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
		break;
	}
	case 'migrations': {
		// TODO: redo migrations
		break;
	}
	default: {
		log('lightning v0.6.0 - cross-platform bot connecting communities', 'blue');
		log('Usage: lightning [subcommand] <options>', 'purple');
		log('Subcommands:', 'green');
		log('help: show this');
		log('run: run an of lightning using the settings in config.ts');
		log('migrations: run migration script');
		log('version: shows version');
		log('Options:', 'green');
		log('--config <string>: absolute path to config file');
		break;
	}
}
