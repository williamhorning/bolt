import { Bolt, defineBoltConfig } from '../lib/mod.ts';
import { colors } from './deps.ts';

export default async function ({ config }: { config?: string }) {
	let cfg;
	const path = `${Deno.cwd()}/${config || 'config.ts'}`;
	try {
		cfg = (await import(path))?.default;
	} catch (e) {
		console.error(colors.red(`Can't load ${path}, exiting...`), e);
		Deno.exit(1);
	}
	const bolt = new Bolt(defineBoltConfig(cfg));
	bolt.on('error', msg => {
		console.error(colors.red((msg as Error).message), msg);
	});
	bolt.on('warning', msg => {
		console.warn(colors.yellow(msg as string));
	});
	await bolt.setup();
}
