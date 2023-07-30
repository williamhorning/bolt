import { Bolt } from './deps.ts';
import DiscordPlugin from './mod.ts';

export async function registerCommands(discord: DiscordPlugin, bolt: Bolt) {
	const data = bolt.commands.map(command => {
		return {
			name: command.name,
			type: 1,
			description: command.description || 'a bolt command',
			options: command.hasOptions
				? [
						{
							name: 'options',
							description: 'option to pass to this command',
							type: 3
						}
				  ]
				: undefined
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
