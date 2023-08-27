import { Bolt } from '../mod.ts';
import { BoltMessage } from '../types.ts';

export type BoltCommandOptions = {
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
