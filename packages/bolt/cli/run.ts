import { Bolt, defineBoltConfig } from '../lib/mod.ts';
import { colors } from './deps.ts';

export default async function run({
	config,
	debug
}: {
	config?: string;
	debug?: true | undefined;
}) {
	let cfg;

	try {
		cfg = (await import(config || `${Deno.cwd()}/config.ts`))?.default;
	} catch (e) {
		console.error(colors.red(`Can't load your config, exiting...\n`), e);
		Deno.exit(1);
	}

	const bolt = new Bolt(defineBoltConfig(cfg));

	bolt.on('error', msg => {
		console.error(msg);
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
