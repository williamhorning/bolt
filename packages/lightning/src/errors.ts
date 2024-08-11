import { create_message, type message } from './types.ts';

/** the error returned from log_error */
export interface err {
	/** the original error */
	e: Error;
	/** extra information about the error */
	extra: Record<string, unknown>;
	/** the uuid associated with the error */
	uuid: string;
	/** the message associated with the error */
	message: message;
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
					embeds: [{ title: e.message, description: uuid }],
				}),
			})
		).text();
	}

	console.error(`%clightning error ${uuid}`, 'color: red');
	console.error(e, extra);

	const message = create_message(
		`Something went wrong! [Look here](https://williamhorning.eu.org/bolt) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``,
	);

	return { e, uuid, extra, message };
}
