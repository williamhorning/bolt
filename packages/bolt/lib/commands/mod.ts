import { Bolt } from '../bolt.ts';
import { BoltEmbed, BoltMessage } from '../types.ts';

type CreateBoltMessageOptions = {
	content?: string;
	embeds?: [BoltEmbed, ...BoltEmbed[]];
};

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
		opts.bolt.emit('error', e);
		await opts.reply(
			createBoltMessage({
				content: `Something went wrong trying to run that command! Join the Bolt support server and share the following information:\n\`\`\`\n${e}\`\`\``
			})
		);
	}
}

export function createBoltMessage(
	opts: CreateBoltMessageOptions
): BoltMessage<CreateBoltMessageOptions> {
	return {
		author: {
			rawname: 'Bolt',
			username: 'Bolt',
			id: 'bolt'
		},
		...opts,
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Date.now(),
		platform: {
			name: 'bolt',
			message: opts
		}
	};
}

export * from './info.ts';
