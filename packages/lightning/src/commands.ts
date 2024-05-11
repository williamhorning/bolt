import { parseArgs } from '../deps.ts';
import { log_error } from './errors.ts';
import type { lightning } from './lightning.ts';
import { create_message, type message } from './messages.ts';

export function setup_commands(l: lightning) {
	const prefix = l.config.cmd_prefix || 'l!';

	l.on('create_nonbridged_message', m => {
		if (!m.content?.startsWith(prefix)) return;

		const {
			_: [cmd, subcmd],
			...opts
		} = parseArgs(m.content.replace(prefix, '').split(' '));

		run_command({
			lightning: l,
			cmd: cmd as string,
			subcmd: subcmd as string,
			opts,
			...m
		});
	});

	l.on('run_command', i => run_command({ lightning: l, ...i }));
}

/** arguments passed to a command */
export interface command_arguments {
	/** the name of the command */
	cmd: string;
	/** the subcommand being run, if any */
	subcmd?: string;
	/** the channel its being run in */
	channel: string;
	/** the plugin its being run on */
	plugin: string;
	/** timestamp given */
	timestamp: Temporal.Instant;
	/** options passed by the user */
	opts: Record<string, string>;
	/** the function to reply to the command */
	reply: (message: message, optional?: unknown) => Promise<void>;
	/** the instance of lightning the command is ran against */
	lightning: lightning;
}

/** options when parsing a command */
export interface command_options {
	/** this will be the key passed to options.opts in the execute function */
	argument_name?: string;
	/** whether or not the argument provided is required */
	argument_required?: boolean;
	/** an array of commands that show as subcommands */
	subcommands?: command[];
}

/** commands are a way for users to interact with the bot */
export interface command {
	/** the name of the command */
	name: string;
	/** an optional description */
	description?: string;
	/** options when parsing the command */
	options?: command_options;
	/** a function that returns a message */
	execute: (options: command_arguments) => Promise<string> | string;
}

async function run_command(args: command_arguments) {
	let reply;

	try {
		const cmd =
			args.lightning.commands.get(args.cmd) ||
			args.lightning.commands.get('help')!;

		const exec =
			cmd.options?.subcommands?.find(i => i.name === args.subcmd)?.execute ||
			cmd.execute;

		reply = create_message(await exec(args));
	} catch (e) {
		reply = (await log_error(e, { ...args, reply: undefined })).message;
	}

	try {
		await args.reply(reply, false);
	} catch (e) {
		await log_error(e, { ...args, reply: undefined });
	}
}
