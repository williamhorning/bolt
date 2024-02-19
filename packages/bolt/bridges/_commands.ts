import { command, create_message, Bolt } from './_deps.ts';
import { join, leave, reset } from './_command_functions.ts';

export function bridge_commands(bolt: Bolt): command {
	return {
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: () =>
			create_message({
				text: `Try running \`!bolt help\` for help with bridges`
			}),
		options: {
			subcommands: [
				{
					name: 'join',
					description: 'join a bridge',
					execute: async opts => (await join(opts, bolt)).text,
					options: { argument_name: 'name', argument_required: true }
				},
				{
					name: 'leave',
					description: 'leave a bridge',
					execute: async opts => (await leave(opts, bolt)).text
				},
				{
					name: 'reset',
					description: 'reset a bridge',
					execute: async opts => (await reset(opts, bolt)).text,
					options: { argument_name: 'name' }
				},
				{
					name: 'status',
					description: "see what bridges you're in",
					execute: async ({ channel }) => {
						const data = await bolt.bridge.getBridge({ channel });
						const text = data?._id
							? `This channel is connected to \`${data._id}\``
							: "You're not in any bridges right now.";
						return create_message({ text });
					}
				}
			]
		}
	};
}
