import { create_message } from './messages.ts';
import type { message } from './types.ts';

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

	if ('lightning' in extra) delete extra.lightning;

	if (
		'opts' in extra &&
		'lightning' in (extra.opts as Record<string, unknown>)
	) delete (extra.opts as Record<string, unknown>).lightning;

	if (error_hook && error_hook.length > 0) {
		const resp = await fetch(error_hook, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: `# ${e.message}\n*${uuid}*`,
				embeds: [
					{
						title: 'extra',
						description: `\`\`\`json\n${
							JSON.stringify(extra, null, 2)
						}\n\`\`\``,
					},
				],
			}),
		});

		if (!resp.ok) {
			await fetch(error_hook, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: `# ${e.message}\n*${uuid}*`,
					embeds: [
						{
							title: 'extra',
							description: '*see console*',
						},
					],
				}),
			});
		}
	}

	console.error(`%clightning error ${uuid}`, 'color: red');
	console.error(e, extra);

	const message = create_message(
		`Something went wrong! [Look here](https://williamhorning.eu.org/bolt) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``,
	);

	return { e, uuid, extra, message };
}
