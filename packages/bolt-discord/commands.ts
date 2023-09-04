import { Bolt, RESTPutAPIApplicationCommandsJSONBody } from './deps.ts';
import DiscordPlugin from './mod.ts';

export async function registerCommands(discord: DiscordPlugin, bolt: Bolt) {
	const data: RESTPutAPIApplicationCommandsJSONBody = [
		...bolt.cmds.commands.values()
	].map(command => {
		const opts = [];

		if (command.options?.hasArgument) {
			opts.push({
				name: 'options',
				description: 'option to pass to this command',
				type: 3,
				required: true
			});
		}

		if (command.options?.subcommands) {
			command.options.subcommands.map(i => {
				const cmd = {
					name: i.name,
					description: i.description,
					type: 1,
					options: [] as unknown[]
				};
				if (i.options?.hasArgument) {
					cmd.options.push({
						name: 'options',
						description: 'option to pass to this command',
						type: 3,
						required: true
					});
				}
				return cmd;
			});
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
