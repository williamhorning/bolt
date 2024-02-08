import { Bolt, BoltMessage } from './mod.ts';
import { parseArgs } from './deps.ts';

export class BoltCommands {
	private bolt: Bolt;
	public commands = new Map<string, BoltCommand>();
	private fallback: BoltCommand = {
		name: 'help',
		execute: this.runHelpCommand.bind(this)
	};

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.bolt.on('msgcreate', msg => {
			if (msg.content?.startsWith('!bolt')) {
				const opts = parseArgs({
					args: msg.content.split(' '),
					strict: false
				});
				opts.positionals.shift();
				this.runCommand({
					channel: msg.channel,
					cmd: opts.positionals.shift() as string,
					subcmd: opts.positionals.shift(),
					opts: opts.values as Record<string, string>,
					platform: msg.platform.name,
					timestamp: msg.timestamp,
					replyfn: msg.reply
				});
			}
		});
		this.registerDefaultCommands();
	}

	registerCommands(...cmds: BoltCommand[]) {
		for (const cmd of cmds) {
			this.commands.set(cmd.name, cmd);
			if (cmd.options?.default) this.fallback = cmd;
		}
	}

	async runCommand(opts: Omit<Omit<BoltCommandArguments, 'bolt'>, 'commands'>) {
		const command: BoltCommand = this.commands.get(opts.cmd) || this.fallback;
		const cmdopts = { ...opts, commands: this, bolt: this.bolt };
		let reply;
		try {
			let cmd;
			if (command.options?.subcommands && opts.subcmd) {
				cmd = command.options.subcommands.find(i => i.name === opts.subcmd);
			}
			if (!cmd) cmd = command;
			reply = await cmd.execute(cmdopts);
		} catch (e) {
			reply = await this.bolt.logError(e, { ...opts, reply: undefined });
		}
		try {
			await opts.replyfn(reply, false);
		} catch (e) {
			await this.bolt.logError(e, { ...opts, reply: undefined });
		}
	}

	private runHelpCommand() {
		return this.bolt.createMsg({
			embeds: [
				{
					title: 'Bolt Help',
					description:
						"Here's some basic help. Take a look at [the docs](https://williamhorning.dev/bolt/docs) for more information.",
					fields: [
						{
							name: 'Commands',
							value: [...this.commands.keys()].map(i => `\`${i}\``).join(', '),
							inline: true
						}
					]
				}
			]
		});
	}

	private registerDefaultCommands() {
		this.registerCommands(
			{
				name: 'info',
				description: 'get information about bolt',
				execute: ({ bolt }) => {
					return bolt.createMsg({
						text: `Bolt ${bolt.version} running with a bunch of open-source software.`
					});
				}
			},
			{
				name: 'ping',
				description: 'pong',
				execute({ timestamp, bolt }) {
					return bolt.createMsg({
						text: `Pong! 🏓 ${Date.now() - timestamp}ms`
					});
				}
			},
			{
				name: 'site',
				description: 'links to the bolt site',
				execute: ({ bolt }) => {
					return bolt.createMsg({
						text: `You can find the Bolt site at https://williamhorning.dev/bolt`
					});
				}
			}
		);
	}
}

export type BoltCommandArguments = {
	bolt: Bolt;
	commands: BoltCommands;
	cmd: string;
	subcmd?: string;
	channel: string;
	platform: string;
	opts: Record<string, string>;
	timestamp: number;
	replyfn: BoltMessage<unknown>['reply'];
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
