import { parseArgs } from '../../deps.ts';
import { migrations } from './migrations.ts';
import { run } from './run.ts';

const args = parseArgs(Deno.args, {
	string: ['config']
});

const cmd = args._[0];

if (cmd === 'version') {
	console.log('0.6.0');
} else if (cmd === 'run') {
	run(args.config);
} else if (cmd === 'migrations') {
	migrations();
} else {
	console.log(
		'lightning v0.6.0 - cross-platform bot connecting communities',
		'blue'
	);
	console.log('Usage: lightning [subcommand] <options>', 'purple');
	console.log('Subcommands:', 'green');
	console.log('help: show this');
	console.log('run: run an of lightning using the settings in config.ts');
	console.log('migrations: run migration script');
	console.log('version: shows version');
	console.log('Options:', 'green');
	console.log('--config <string>: absolute path to config file');
}
