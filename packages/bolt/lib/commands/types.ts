import { Bolt } from '../bolt.ts';
import { BoltMessage } from '../types.ts';
import { BoltCommands } from './commands.ts';

export type BoltCommandArguments = {
	arg?: string;
	bolt: Bolt;
	commands: BoltCommands;
	channel: string;
	name: string;
	platform: string;
	reply: (message: BoltMessage<unknown>) => Promise<void>;
	timestamp: number;
};

export type BoltCommandOptions = {
	default?: boolean;
	hasArgument?: boolean;
	subcommands?: BoltCommand[];
};

export type BoltCommand = {
	name: string;
	description?: string;
	options?: BoltCommandOptions;
	execute: (
		opts: BoltCommandArguments
	) => Promise<BoltMessage<unknown>> | BoltMessage<unknown>;
};
