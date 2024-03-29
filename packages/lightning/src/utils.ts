import type { Document } from 'mongo';
import { fourbetafive, fourfourbeta } from './migrations.ts';
import type { config, err, message, migration, versions } from './types.ts';

/** apply many migrations given mongodb documents */
export function apply_migrations(
	migrations: migration[],
	data: Document[]
): Document[] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}

/**
 * creates a message that can be sent using lightning
 * @param text the text of the message (can be markdown)
 */
export function create_message(text: string): message<undefined> {
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
		platform: {
			name: 'lightning',
			message: undefined
		}
	};
	return data;
}

/** a function that returns a config object when given a partial config object */
export function define_config(config?: Partial<config>): config {
	return {
		plugins: [],
		mongo_uri: 'mongodb://localhost:27017',
		mongo_database: 'lightning',
		redis_host: 'localhost',
		redis_port: 6379,
		...(config || {})
	};
}

/** get migrations that can then be applied using apply_migrations */
export function get_migrations(from: versions, to: versions): migration[] {
	const migrations: migration[] = [fourfourbeta, fourbetafive];
	const indexoffrom = migrations.findIndex(i => i.from === from);
	const indexofto = migrations.findLastIndex(i => i.to === to);
	return migrations.slice(indexoffrom, indexofto + 1);
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

	if (error_hook)
		await (
			await fetch(error_hook, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					embeds: [{ title: e.message, description: uuid }]
				})
			})
		).text();

	console.error(`%cLightning Error ${uuid}`, 'color: red');
	console.error(e, extra);

	return {
		e,
		cause: e.cause,
		uuid,
		extra,
		message: create_message(
			`Something went wrong! [Look here](https://williamhorning.dev/bolt) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``
		)
	};
}
