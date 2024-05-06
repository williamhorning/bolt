import { fivesevenexistingredis } from './migrations.ts';
import type { config, err, message, migration, versions } from './types.ts';

/**
 * utilities used by lightning
 * @module
 */

/**
 * apply many migrations given data
 * @param migrations the migrations to apply
 * @param data the data to apply the migrations to
 */
export function apply_migrations(
	migrations: migration[],
	data: [string, unknown][]
): [string, unknown][] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}

/**
 * creates a message that can be sent using lightning
 * @param text the text of the message (can be markdown)
 */
export function create_message(text: string): message {
	const data = {
		author: {
			username: 'lightning',
			profile: 'https://williamhorning.dev/assets/lightning.png',
			rawname: 'lightning',
			id: 'lightning'
		},
		content: text,
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Temporal.Now.instant(),
		plugin: 'lightning'
	};
	return data;
}

/**
 * a function that returns a config object when given a partial config object
 * @param config a partial config object
 */
export function define_config(config?: Partial<config>): config {
	return {
		plugins: [],
		redis_host: 'localhost',
		redis_port: 6379,
		...(config || {})
	};
}

/**
 * get migrations that can then be applied using apply_migrations
 * @param from the version that the data is currently in
 * @param to the version that the data will be migrated to
 */
export function get_migrations(from: versions, to: versions): migration[] {
	const migrations: migration[] = [fivesevenexistingredis];
	return migrations.slice(
		migrations.findIndex(i => i.from === from),
		migrations.findLastIndex(i => i.to === to) + 1
	);
}

/**
 * logs an error and returns a unique id and a message for users
 * @param e the error to log
 * @param extra any extra data to log
 * @param _id a function that returns a unique id (used for testing)
 */
export async function log_error(
	e: Error,
	extra: Record<string, unknown> = {},
	_id?: () => string
): Promise<err> {
	const uuid = _id ? _id() : crypto.randomUUID();
	const error_hook = Deno.env.get('LIGHTNING_ERROR_HOOK');

	if (error_hook) {
		await (
			await fetch(error_hook, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					embeds: [{ title: e.message, description: uuid }]
				})
			})
		).text();
	}

	console.error(`%clightning error ${uuid}`, 'color: red');
	console.error(e, extra);

	const message = create_message(
		`Something went wrong! [Look here](https://williamhorning.dev/bolt) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``
	);

	return { e, uuid, extra, message };
}
