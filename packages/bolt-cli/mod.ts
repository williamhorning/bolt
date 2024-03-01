import { Bolt, CliffyApp, colors } from './deps.ts';
import migration from './migrations.ts';

const cli = new CliffyApp()
	.name('bolt')
	.version('0.5.5')
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
	.option('--debug', 'enables debug mode')
	.action(async ({ config }: { config?: string }) => {
		let cfg;

		try {
			cfg = (await import(config || `${Deno.cwd()}/config.ts`))?.default;
		} catch (e) {
			console.error(colors.red(`Can't load your config, exiting...\n`), e);
			Deno.exit(1);
		}

		await Bolt.setup(cfg);
	});

cli.parse(Deno.args);
