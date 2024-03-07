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
							title: 'bolt help',
							description:
								'Check out [the docs](https://williamhorning.dev/bolt/) for help.'
						}
					]
				})
		}
	],
	[
		'version',
		{
			name: 'version',
			description: "get bolt's version",
			execute: () =>
				create_message({
					text: 'hello from bolt 0.5.8!'
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
	]
] as [string, command][];
