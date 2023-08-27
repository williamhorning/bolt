import { logBoltError } from '../utils.ts';
import { BoltCommand, BoltCommandOptions } from './types.ts';

export async function handleBoltCommand(opts: BoltCommandOptions) {
	// this is bad
	let command = opts.bolt.commands.find(i => i.name === opts.name);
	if (!command)
		command = opts.bolt.commands.find(i => i.name === 'help') as BoltCommand;
	try {
		const result = await command.execute(opts);
		await opts.reply(result);
	} catch (e) {
		await opts.reply(
			(
				await logBoltError(opts.bolt, {
					cause: e,
					message: `Running that command failed:\n${e.message || e}`,
					extra: opts,
					code: 'CommandFailed'
				})
			).boltmessage
		);
	}
}

export * from './info.ts';
export type { BoltCommand, BoltCommandOptions };
