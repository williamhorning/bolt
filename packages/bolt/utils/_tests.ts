import { assertEquals } from 'https://deno.land/std@0.216.0/assert/mod.ts';
import { create_message, define_config, log_error } from './mod.ts';
import {
	cfg,
	msg,
	err,
	extra,
	err_id,
	err_return,
	err_hook
} from './_testdata.ts';

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = () => {};

console.error = () => {};

Deno.test('message creation', () => {
	const msg_real = create_message({
		text: 'test',
		embeds: [{ description: 'test' }],
		uuid: 'test'
	});

	msg_real.reply = msg.reply;

	assertEquals(msg_real, msg);
});

Deno.test('config handling', () => {
	assertEquals(define_config(), cfg);
});

Deno.test('error handling basic', async () => {
	const err_return_real = await log_error(err, extra, err_id);

	err_return_real.message.reply = err_return.message.reply;

	assertEquals(err_return_real, err_return);
});

Deno.test('error handling webhook test', async () => {
	Deno.env.set('BOLT_ERROR_HOOK', 'http://localhost:8000');

	let res: (value: unknown) => void;

	const promise = new Promise(resolve => {
		res = resolve;
	});

	const server = Deno.serve(async req => {
		res(await req.json());
		return new Response();
	});

	await log_error(err, extra, err_id);
	await server.shutdown();

	assertEquals(await promise, err_hook);
});
