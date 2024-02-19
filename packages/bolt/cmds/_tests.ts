import { assertEquals } from 'https://deno.land/std@0.216.0/assert/mod.ts';
import { bolt_commands } from './mod.ts';
import { message } from './_deps.ts';
import { help_output } from './_testdata.ts';

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

Deno.test('Run help command', async () => {
	const cmds = new bolt_commands();

	let res: (value: message<unknown>) => void;

	const promise = new Promise<message<unknown>>(resolve => {
		res = resolve;
	});

	await cmds.run({
		channel: '',
		cmd: 'help',
		opts: {},
		platform: 'bolt',
		// deno-lint-ignore require-await
		replyfn: async msg => res(msg),
		timestamp: temporal_instant
	});

	const result = await promise;

	result.reply = help_output.reply;

	assertEquals(result, help_output);
});
