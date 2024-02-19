import { message } from './_deps.ts';

export type command_arguments = {
	channel: string;
	cmd: string;
	opts: Record<string, string>;
	platform: string;
	replyfn: message<unknown>['reply'];
	subcmd?: string;
	timestamp: Temporal.Instant;
};

export type command = {
	name: string;
	description?: string;
	options?: {
		default?: boolean;
		argument_name?: string;
		argument_required?: boolean;
		subcommands?: command[];
	};
	execute: (
		opts: command_arguments
	) => Promise<message<unknown>> | message<unknown>;
};
