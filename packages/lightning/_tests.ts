import { assertEquals } from 'assert_eq';
import {
	cmd_help_output,
	migrations_five,
	migrations_four_one,
	migrations_four_two,
	migrations_fourbeta,
	utils_cfg,
	utils_err,
	utils_err_id,
	utils_err_return,
	utils_extra,
	utils_err_hook,
	utils_msg
} from './_testdata.ts';
import {
	commands,
	message,
	apply_migrations,
	get_migrations,
	define_config,
	log_error,
	create_message
} from './utils/mod.ts';
import fourfourbeta from './utils/_fourfourbeta.ts';
import fourbetafive from './utils/_fourbetafive.ts';
import { versions } from './utils/migrations.ts';

// override globals

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = console.error = () => {};

// cmds

Deno.test('cmds', async t => {
	const cmds = new commands();

	await t.step('run help command', async () => {
		let res: (value: message<unknown>) => void;

		const promise = new Promise<message<unknown>>(resolve => {
			res = resolve;
		});

		await cmds.run({
			channel: '',
			cmd: 'help',
			opts: {},
			platform: 'lightning',
			// deno-lint-ignore require-await
			replyfn: async msg => res(msg),
			timestamp: temporal_instant
		});

		const result = await promise;

		result.reply = cmd_help_output.reply;

		assertEquals(result, cmd_help_output);
	});
});

// migrations

Deno.test('migrations', async t => {
	await t.step('get a migration', () => {
		const migrations = get_migrations(versions.Four, versions.FourBeta);
		assertEquals(migrations, [fourfourbeta]);
	});

	await t.step('apply migrations', async t => {
		await t.step('0.4 => 0.4-beta (one platform)', () => {
			const result = apply_migrations([fourfourbeta], migrations_four_one);

			assertEquals(result, []);
		});

		await t.step('0.4 => 0.4-beta (two platforms)', () => {
			const result = apply_migrations([fourfourbeta], migrations_four_two);

			assertEquals(result, migrations_fourbeta);
		});

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
