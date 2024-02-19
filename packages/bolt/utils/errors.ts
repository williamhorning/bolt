import { nanoid } from './_deps.ts';
import { create_message } from './messages.ts';

function get_replacer() {
	const seen = new WeakSet();
	// deno-lint-ignore no-explicit-any
	return (_: any, value: any) => {
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

export async function log_error(
	e: Error,
	// deno-lint-ignore no-explicit-any
	extra: Record<string, any> = {},
	_id: () => string = nanoid
) {
	const uuid = _id();

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
									get_replacer()
								)}\`\`\``
							}
						]
					},
					get_replacer()
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
			text: `Something went wrong!\nCheck [the docs](https://williamhorning.dev/bolt/docs/Using/) for help.\n\`\`\`${e.message}\n${uuid}\`\`\``,
			uuid
		})
	};
}
