import { parseArgs, Bolt, log_error } from './_deps.ts';
import { default_commands } from './_default.ts';
import { command, command_arguments } from './types.ts';

export class bolt_commands {
	commands = new Map<string, command>(default_commands);

	register(...cmds: command[]) {
		for (const cmd of cmds) {
			this.commands.set(cmd.name, cmd);
		}
	}

	listen(bolt: Bolt) {
		bolt.on('msgcreate', msg => {
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

		bolt.on('commandCreate', async cmd => {
			await this.run(cmd);
		});
	}

	async run(opts: command_arguments) {
		const cmd = this.commands.get(opts.cmd) || this.commands.get('help')!;
		const cmd_opts = { ...opts, commands: this };
		let reply;
		try {
			let execute;
			if (cmd.options?.subcommands && opts.subcmd) {
				execute = cmd.options.subcommands.find(
					i => i.name === opts.subcmd
				)?.execute;
			}
			if (!execute) execute = cmd.execute;
			reply = await execute(cmd_opts);
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

export * from './types.ts';
