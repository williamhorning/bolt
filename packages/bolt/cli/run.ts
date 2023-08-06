// TODO: remove this line after denoland/deno#20028 is fixed
import 'node:domain';
import { Bolt, defineBoltConfig } from '../lib/mod.ts';
import { colors } from './deps.ts';

export default async function ({ config }: { config?: string }) {
	let cfg;
	const path = `${Deno.cwd()}/${config || 'config.ts'}`;
	try {
		cfg = (await import(path))?.default;
	} catch (e) {
		console.error(colors.red(`Can't load ${path}, exiting...\n`), e);
		Deno.exit(1);
	}
	const bolt = new Bolt(defineBoltConfig(cfg));
	bolt.on('error', msg => {
		console.error(msg);
	});
	bolt.on('warning', msg => {
		console.warn(colors.yellow(msg));
	});
	await bolt.setup();
}
