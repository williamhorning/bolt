import { Bolt } from '../bolt.ts';
import { getBoltBridgedMessage } from '../bridge/mod.ts';
import { logBoltError } from '../utils.ts';
import defaultcommands from './default.ts';
import { BoltCommand, BoltCommandArguments } from './types.ts';

export class BoltCommands {
	bolt: Bolt;
	commands = new Map<string, BoltCommand>();
	fallback = defaultcommands[0];
	defaultcommands = defaultcommands;

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.registerCommands(...defaultcommands);
		bolt.on('messageCreate', async msg => {
			if (await getBoltBridgedMessage(bolt, msg.id)) return;
			if (msg.content?.startsWith('!bolt')) {
				this.runCommand({
					name: msg.content.split(' ')[1],
					reply: msg.reply,
					channel: msg.channel,
					platform: msg.platform.name,
					arg: msg.content.split(' ')[2],
					timestamp: msg.timestamp
				});
			}
		});
	}

	registerCommands(...cmds: BoltCommand[]) {
		for (const cmd of cmds) {
			this.commands.set(cmd.name, cmd);
			if (cmd.options?.default) this.fallback = cmd;
		}
	}

	async runCommand(opts: Omit<Omit<BoltCommandArguments, 'bolt'>, 'commands'>) {
		const cmd: BoltCommand = this.commands.get(opts.name) || this.fallback;
		const cmdopts = { ...opts, ...this, commands: this };
		try {
			let reply;
			if (cmd.options?.subcommands && opts.arg) {
				const [name, ...arg] = opts.arg.split(' ');
				let subcmd = cmd.options.subcommands.find(i => i.name === name);
				if (!subcmd) subcmd = cmd;
				reply = await subcmd.execute({ ...cmdopts, arg: arg.join(' ') });
			} else {
				reply = await cmd.execute(cmdopts);
			}
			cmdopts.reply(reply);
		} catch (e) {
			await opts.reply(
				(
					await logBoltError(this.bolt, {
						cause: e,
						message: `Running that command failed:\n${e.message || e}`,
						extra: opts,
						code: 'CommandFailed'
					})
				).boltmessage
			);
		}
	}
}
