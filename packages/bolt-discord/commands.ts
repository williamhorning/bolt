import { API, lightning, cmd_body } from './_deps.ts';
import { discord_config } from './mod.ts';

export async function register_commands(
	config: discord_config,
	api: API,
	l: lightning
) {
	if (!config.slash_cmds) return;

	const data: cmd_body = [...l.cmds.values()].map(command => {
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
					return {
						name: i.name,
						description: i.description || i.name,
						type: 1,
						options: i.options?.argument_name
							? [
									{
										name: i.options.argument_name,
										description: i.options.argument_name,
										type: 3,
										required: i.options.argument_required || false
									}
							  ]
							: undefined
					};
				})
			);
		}

		return {
			name: command.name,
			type: 1,
			description: command.description || 'a command',
			options: opts
		};
	});

	await api.applicationCommands.bulkOverwriteGlobalCommands(
		config.app_id,
		data
	);
}
