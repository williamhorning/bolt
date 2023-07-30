import { Bolt } from '../bolt.ts';
import { BoltMessage } from '../types.ts';
import { logBoltError } from '../utils.ts';

type BoltCommandOptions = {
	bolt: Bolt;
	name: string;
	reply: (message: BoltMessage<unknown>) => Promise<void>;
	channel: string;
	platform: string;
	arg?: string;
	timestamp: number;
};

export type BoltCommand = {
	name: string;
	description?: string;
	hasOptions?: boolean;
	execute: (
		opts: BoltCommandOptions
	) => Promise<BoltMessage<unknown>> | BoltMessage<unknown>;
};

export async function handleBoltCommand(opts: BoltCommandOptions) {
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
			).message
		);
	}
}

export * from './info.ts';
