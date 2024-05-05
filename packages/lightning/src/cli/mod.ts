import { parseArgs, args } from '../../deps.ts';
import { migrations } from './migrations.ts';
import { run } from './run.ts';

const cli_args = parseArgs(args(), {
	string: ['config']
});

const cmd = cli_args._[0];

if (cmd === 'version') {
	console.log('0.6.0');
} else if (cmd === 'run') {
	await setup_shim()
	run(cli_args.config);
} else if (cmd === 'migrations') {
	await setup_shim()
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

async function setup_shim() {
	if ("Deno" in globalThis) return;
	const Deno = await import("npm:@deno/shim-deno@0.19.1")
	// @ts-ignore this works
	globalThis.Deno = Deno.Deno
}