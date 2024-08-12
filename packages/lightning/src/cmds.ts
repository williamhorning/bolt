import type { command } from './commands.ts';

export const default_cmds = [
	[
		'help',
		{
			name: 'help',
			description: 'get help',
			execute: () =>
				'check out [the docs](https://williamhorning.eu.org/bolt/) for help.',
		},
	],
	[
		'version',
		{
			name: 'version',
			description: 'get the bots version',
			execute: () => 'hello from v0.7.3!',
		},
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				`Pong! 🏓 ${
					Temporal.Now.instant()
						.since(timestamp)
						.total('milliseconds')
				}ms`,
		},
	],
] as [string, command][];
