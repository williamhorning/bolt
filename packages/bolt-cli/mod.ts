import { CliffyApp, colors, Bolt } from './deps.ts';
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
	.action(
		async ({
			config,
			debug
		}: {
			config?: string;
			debug?: true | undefined;
		}) => {
			let cfg;

			try {
				cfg = (await import(config || `${Deno.cwd()}/config.ts`))?.default;
			} catch (e) {
				console.error(colors.red(`Can't load your config, exiting...\n`), e);
				Deno.exit(1);
			}

			const bolt = await Bolt.setup(cfg);

			bolt.on('error', msg => {
				console.error(colors.red(`Bolt Error - '${msg.uuid}'`));
				console.error(msg.e, msg.extra);
			});

			bolt.on('warning', msg => {
				console.warn(colors.yellow(msg));
			});

			if (debug) {
				bolt.on('debug', msg => {
					console.debug(colors.blue(msg as string));
				});
			}
		}
	);

cli.parse(Deno.args);
