import { create_message, message } from './messages.ts';

/** logs an error and returns a unique id and a message for users */
export async function log_error(
	e: Error,
	extra: Record<string, unknown> = {},
	_id: () => string = crypto.randomUUID
): Promise<{
	e: Error;
	extra: Record<string, unknown>;
	uuid: string;
	message: message<unknown>;
}> {
	const uuid = _id();

	// TODO: replace deno.env
	const error_hook = Deno.env.get('BOLT_ERROR_HOOK');

	if (error_hook && error_hook !== '') {
		delete extra.msg;

		await (
			await fetch(error_hook, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(
					{
						embeds: [
							{
								title: e.message,
								description: `\`\`\`${
									e.stack
								}\`\`\`\n\`\`\`js\n${JSON.stringify(
									{
										...extra,
										uuid
									},
									replacer(),
									2
								)}\`\`\``
							}
						]
					},
					replacer()
				)
			})
		).text();
	}

	console.error(`\x1b[1;31mBolt Error - '${uuid}'\x1b[0m`);
	console.error(e, extra);

	return {
		e,
		uuid,
		extra,
		message: create_message({
			text: `Something went wrong! Check [the docs](https://williamhorning.dev/bolt/docs/Using/) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``
		})
	};
}

function replacer() {
	const seen = new WeakSet();
	return (_: string, value: unknown) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return '[Circular]';
			}
			seen.add(value);
		}
		if (typeof value === 'bigint') {
			return value.toString();
		}
		return value;
	};
}
