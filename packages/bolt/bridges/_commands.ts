import { join, leave, reset, toggle, status } from './_command_functions.ts';
import { command, create_message } from '../utils/mod.ts';
import { Bolt } from '../bolt.ts';

export function bridge_commands(bolt: Bolt): command {
	return {
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: () =>
			create_message({
				text: 'Try running `!bolt help` for help with bridges'
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
					name: 'toggle',
					description: 'toggle a setting on a bridge',
					execute: async opts => (await toggle(opts, bolt)).text,
					options: {
						argument_name: 'setting',
						argument_required: true
					}
				},
				{
					name: 'status',
					description: 'see what bridges you are in',
					execute: async opts => (await status(opts, bolt)).text
				}
			]
		}
	};
}
