import { Bolt } from '../bolt.ts';
import { log_error } from './errors.ts';
import { parseArgs } from 'std_args';
import { create_message, message } from './messages.ts';

/** a class that provides text-based commands that reply to messages */
export class Commands extends Map<string, command> {
	/**
	 * create a commands instance using the commands given or the default set
	 */
	constructor(default_cmds: [string, command][] = default_commands) {
		super(default_cmds);
	}

	/**
	 * listen for commands on a given bolt instance
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
	 * attempt to run a command
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
				create_message({
					text: 'check out [the docs](https://williamhorning.dev/bolt/) for help.'
				})
		}
	],
	[
		'version',
		{
			name: 'version',
			description: "get bolt's version",
			execute: () =>
				create_message({
					text: 'hello from bolt 0.5.8!'
				})
		}
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				create_message({
					text: `Pong! 🏓 ${Temporal.Now.instant()
						.since(timestamp)
						.total('milliseconds')}ms`
				})
		}
	]
];

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
		argument_name?: string;
		argument_required?: boolean;
		subcommands?: command[];
	};
	execute: (
		opts: command_arguments
	) => Promise<message<unknown>> | message<unknown>;
};
