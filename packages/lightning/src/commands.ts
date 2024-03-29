import { parseArgs } from 'std_args';
import type { lightning } from '../lightning.ts';
import { default_commands } from './default_commands.ts';
import type { command, command_arguments } from './types.ts';
import { log_error } from './utils.ts';

/**
 * commands implements simple command handling for lightning that others may find useful
 */

export class commands extends Map<string, command> {
	prefix: string;

	/**
	 * creates a command handler instance with the given commands
	 * @param opts optional options such as the prefix and commands or an instance of lightning
	 */
	constructor(
		opts?:
			| lightning
			| { config: { cmd_prefix?: string; commands?: [string, command][] } }
	) {
		super(opts?.config.commands || default_commands);
		this.prefix = opts?.config.cmd_prefix || 'l!';

		if (opts && 'on' in opts) {
			opts.on('create_nonbridged_message', msg => {
				if (msg.content?.startsWith(this.prefix)) {
					const args = parseArgs(
						msg.content.replace(this.prefix, '').split(' ')
					);
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

			opts.on('create_command', async cmd => {
				await this.run(cmd);
			});
		}
	}

	/**
	 * run a command given the options that would be passed to it
	 */
	async run(opts: Omit<command_arguments, 'commands'>) {
		let reply;
		try {
			const cmd = this.get(opts.cmd) || this.get('help')!;
			const execute =
				cmd.options?.subcommands && opts.subcmd
					? cmd.options.subcommands.find(i => i.name === opts.subcmd)
							?.execute || cmd.execute
					: cmd.execute;
			reply = await execute({ ...opts, commands: this });
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
