import type { command } from '../lightning/src/types.ts';

export const bolt_commands = [
	[
		'help',
		{
			name: 'help',
			description: 'get help',
			execute: () =>
				'check out [the docs](https://williamhorning.dev/bolt/) for help.'
		}
	],
	[
		'version',
		{
			name: 'version',
			description: 'get the bots version',
			execute: () => 'hello from v0.7.0!'
		}
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				`Pong! 🏓 ${Temporal.Now.instant()
					.since(timestamp)
					.total('milliseconds')}ms`
		}
	]
] as [string, command][];
