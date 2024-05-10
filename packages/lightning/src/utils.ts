import { migrations } from "./migrations.ts";
import type { err, message, migration, versions } from './types.ts';

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
 * get migrations that can then be applied using apply_migrations
 * @param from the version that the data is currently in
 * @param to the version that the data will be migrated to
 */
export function get_migrations(from: versions, to: versions): migration[] {
	return migrations.slice(
		migrations.findIndex(i => i.from === from),
		migrations.findLastIndex(i => i.to === to) + 1
	);
}

/**
 * logs an error and returns a unique id and a message for users
 * @param e the error to log
 * @param extra any extra data to log
 */
export async function log_error(
	e: Error,
	extra: Record<string, unknown> = {},
): Promise<err> {
	const uuid = crypto.randomUUID();
	const error_hook = Deno.env.get('LIGHTNING_ERROR_HOOK');

	if (error_hook && error_hook.length > 0) {
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
