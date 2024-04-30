import { assertEquals } from 'jsr:@std/assert@^0.219.1/assert_equals';
import {
	migrations_five,
	migrations_fourbeta,
	utils_cfg,
	utils_err,
	utils_err_hook,
	utils_err_id,
	utils_err_return,
	utils_extra,
	utils_msg
} from './_testdata.ts';
import { fourbetafive } from './src/migrations.ts';
import { versions } from './src/types.ts';
import {
	apply_migrations,
	create_message,
	define_config,
	get_migrations,
	log_error
} from './src/utils.ts';

// override globals

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = console.error = () => {};

// migrations

Deno.test('migrations', async t => {
	await t.step('get a migration', () => {
		const migrations = get_migrations(versions.FourBeta, versions.Five);
		assertEquals(migrations, [fourbetafive]);
	});

	await t.step('apply migrations', async t => {
		await t.step('0.4-beta => 0.5', () => {
			const result = apply_migrations([fourbetafive], migrations_fourbeta);

			assertEquals(result, migrations_five);
		});
	});
});

// utils

Deno.test('utils', async t => {
	await t.step('config handling', () => {
		assertEquals(define_config(), utils_cfg);
	});

	await t.step('error handling', async t => {
		await t.step('basic', async () => {
			Deno.env.set('LIGHTNING_ERROR_HOOK', '');

			const result = await log_error(utils_err, utils_extra, utils_err_id);

			result.message.reply = utils_err_return.message.reply;

			assertEquals(result, utils_err_return);
		});

		await t.step('webhooks', async () => {
			Deno.env.set('LIGHTNING_ERROR_HOOK', 'http://localhost:8000');

			let res: (value: unknown) => void;

			const promise = new Promise(resolve => {
				res = resolve;
			});

			const server = Deno.serve(async req => {
				res(await req.json());
				return new Response();
			});

			await log_error(utils_err, utils_extra, utils_err_id);

			await server.shutdown();

			assertEquals(await promise, utils_err_hook);
		});
	});

	await t.step('message creation', () => {
		const result = create_message('test');

		result.reply = utils_msg.reply;

		assertEquals(result, utils_msg);
	});
});
