import { parseArgs } from '../../deps.ts';
import { migrations } from './migrations.ts';
import { run } from './run.ts';

const cli_args = parseArgs(Deno.args, {
	string: ['config']
});

const cmd = cli_args._[0];

if (cmd === 'version') {
	console.log('0.6.0');
} else if (cmd === 'run') {
	run(cli_args.config);
} else if (cmd === 'migrations') {
	migrations();
} else {
	console.log('lightning v0.6.0 - cross-platform bot connecting communities');
	console.log('Usage: lightning [subcommand] <options>');
	console.log('Subcommands:');
	console.log('help: show this');
	console.log('run: run an of lightning using the settings in config.ts');
	console.log('migrations: run migration script');
	console.log('version: shows version');
	console.log('Options:');
	console.log('--config <string>: absolute path to config file');
}
