import { Bolt, RESTPutAPIApplicationCommandsJSONBody } from './deps.ts';
import DiscordPlugin from './mod.ts';

export async function registerCommands(discord: DiscordPlugin, bolt: Bolt) {
	const data: RESTPutAPIApplicationCommandsJSONBody = [
		...bolt.cmds.commands.values()
	].map(command => {
		const opts = [];

		if (command.options?.argument_name) {
			opts.push({
				name: command.options.argument_name,
				description: 'option to pass to this command',
				type: 3,
				required: command.options.argument_required
			});
		}

		if (command.options?.subcommands) {
			opts.push(
				...command.options.subcommands.map(i => {
					const cmd = {
						name: i.name,
						description: i.description || i.name,
						type: 1,
						options: [] as {
							type: number;
							name: string;
							description: string;
							required: boolean;
						}[]
					};
					if (i.options?.argument_name) {
						cmd.options.push({
							name: i.options.argument_name,
							description: 'option to pass to this command',
							type: 3,
							required: i.options.argument_required || false
						});
					}
					return cmd;
				})
			);
		}

		return {
			name: command.name,
			type: 1,
			description: command.description || 'a bolt command',
			options: opts
		};
	});

	await discord.bot.api.applicationCommands.bulkOverwriteGlobalCommands(
		discord.config.appId,
		[]
	);

	await discord.bot.api.applicationCommands.bulkOverwriteGlobalCommands(
		discord.config.appId,
		data
	);
}
