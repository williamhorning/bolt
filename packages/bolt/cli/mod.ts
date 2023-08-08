import { CliffyApp } from './deps.ts';
import migration from './migrations.ts';
import run from './run.ts';

const cli = new CliffyApp()
	.name('bolt')
	.version('0.5.1')
	.description('Cross-platform bot connecting communities')
	.default('help')
	.command('help', 'Show this help.')
	.action(() => {
		cli.showHelp();
	})
	.command('migration', 'Starts interactive tool to migrate databases')
	.action(migration)
	.command('run', 'runs an instance of bolt using the settings in config.ts')
	.option(
		'--config <input:string>',
		'path to config file relative to the current directory'
	)
	.action(run);

cli.parse(Deno.args);
