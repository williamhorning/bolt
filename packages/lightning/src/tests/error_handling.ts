import { assertEquals } from '../../deps.ts';
import { log_error } from '../utils.ts';

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = console.error = () => {};

Deno.test('basic error handling', async () => {
	Deno.env.set('LIGHTNING_ERROR_HOOK', '');

	const result = await log_error(err, extra, error_id);

	result.message.reply = error_return.message.reply;

	assertEquals(result, error_return);
});

Deno.test('webhook error handling', async () => {
	Deno.env.set('LIGHTNING_ERROR_HOOK', 'http://localhost:8000');

	let res: (value: unknown) => void;

	const promise = new Promise(resolve => {
		res = resolve;
	});

	const server = Deno.serve(async req => {
		res(await req.json());
		return new Response();
	});

	await log_error(err, extra, error_id);

	await server.shutdown();

	assertEquals(await promise, error_webhook);
});

const err = new Error('test');
const extra = { test: 'test' };
const error_id = () => 'test';

const error_return = {
	e: err,
	cause: err.cause,
	uuid: 'test',
	extra: { test: 'test' },
	message: {
		author: {
			username: 'lightning',
			profile: 'https://williamhorning.dev/assets/lightning.png',
			rawname: 'lightning',
			id: 'lightning'
		},
		content:
			'Something went wrong! [Look here](https://williamhorning.dev/bolt) for help.\n```\ntest\ntest\n```',
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
		platform: {
			name: 'lightning',
			message: undefined
		}
	}
};

const error_webhook = {
	embeds: [
		{
			title: err.message,
			description: error_return.uuid
		}
	]
};
