import { Bolt } from '../bolt.ts';
import { log_error } from './errors.ts';
import { parseArgs } from 'std_args';
import { create_message, message } from './messages.ts';

/**
 * commands implements simple command handling for bolt that others may find useful
 */
export class commands extends Map<string, command> {
	/**
	 * creates a command handler instance with the given commands
	 * @param default_cmds - the commands to use by default, should include help as a fallback command
	 */
	constructor(default_cmds: [string, command][] = default_commands) {
		super(default_cmds);
	}

	/**
	 * listen for commands on the given bolt instance
	 */
	listen(bolt: Bolt) {
		bolt.on('create_nonbridged_message', msg => {
			if (msg.content?.startsWith('!bolt')) {
				const args = parseArgs(msg.content.split(' '));
				args._.shift();
				this.run({
					channel: msg.channel,
					cmd: args._.shift() as string,
					subcmd: args._.shift() as string,
					opts: args as Record<string, string>,
					platform: msg.platform.name,
					timestamp: msg.timestamp,
					replyfn: msg.reply
				});
			}
		});

		bolt.on('create_command', async cmd => {
			await this.run(cmd);
		});
	}

	/**
	 * run a command given the options that would be passed to it
	 */
	async run(opts: command_arguments) {
		let reply;
		try {
			const cmd = this.get(opts.cmd) || this.get('help')!;
			const execute =
				cmd.options?.subcommands && opts.subcmd
					? cmd.options.subcommands.find(i => i.name === opts.subcmd)
							?.execute || cmd.execute
					: cmd.execute;
			reply = await execute(opts);
		} catch (e) {
			reply = (await log_error(e, { ...opts, reply: undefined })).message;
		}
		try {
			await opts.replyfn(reply, false);
		} catch (e) {
			await log_error(e, { ...opts, reply: undefined });
		}
	}
}

const default_commands: [string, command][] = [
	[
		'help',
		{
			name: 'help',
			description: 'get help',
			execute: () =>
				create_message(
					'check out [the docs](https://williamhorning.dev/bolt/) for help.'
				)
		}
	],
	[
		'version',
		{
			name: 'version',
			description: "get bolt's version",
			execute: () => create_message('hello from bolt 0.5.8!')
		}
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				create_message(
					`Pong! 🏓 ${Temporal.Now.instant()
						.since(timestamp)
						.total('milliseconds')}ms`
				)
		}
	]
];

export interface command_arguments {
	channel: string;
	cmd: string;
	opts: Record<string, string>;
	platform: string;
	replyfn: message<unknown>['reply'];
	subcmd?: string;
	timestamp: Temporal.Instant;
}

export interface command {
	/** the name of the command */
	name: string;
	/** an optional description */
	description?: string;
	options?: {
		/** this will be the key passed to options.opts in the execute function */
		argument_name?: string;
		/** whether or not the argument provided is required */
		argument_required?: boolean;
		/** an array of commands that show as subcommands */
		subcommands?: command[];
	};
	/** a function that returns a message */
	execute: (
		options: command_arguments
	) => Promise<message<unknown>> | message<unknown>;
}
