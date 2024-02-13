import { create_message } from './_deps.ts';
import { command } from './types.ts';

export const default_commands = [
	[
		'help',
		{
			name: 'help',
			description: 'get help',
			execute: () =>
				create_message({
					embeds: [
						{
							title: `bolt help`,
							description: `Check out [the docs](https://williamhorning.dev/bolt/) for help.`
						}
					]
				})
		}
	],
	[
		'info',
		{
			name: 'info',
			description: 'get information about bolt',
			execute: () =>
				create_message({
					text: `bolt 0.5.5 running with a bunch of open-source software.`
				})
		}
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				create_message({
					text: `Pong! 🏓 ${Temporal.Now.instant()
						.since(timestamp)
						.total('milliseconds')}ms`
				})
		}
	],
	[
		'site',
		{
			name: 'site',
			execute: () =>
				create_message({
					text: `You can find the bolt site at https://williamhorning.dev/bolt`
				})
		}
	]
] as [string, command][];
