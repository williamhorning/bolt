import type { command } from './types.ts';
import { create_message } from './utils.ts';

// TODO: move outside of core

export const default_commands: [string, command][] = [
	[
		'help',
		{
			name: 'help',
			description: 'get help',
			execute: () =>
				create_message(
					'check out [the docs](https://williamhorning.dev/bolt/) for help.'
				)
		}
	],
	[
		'version',
		{
			name: 'version',
			description: 'get the bots version',
			execute: () => create_message('hello from v0.6.0!')
		}
	],
	[
		'ping',
		{
			name: 'ping',
			description: 'pong',
			execute: ({ timestamp }) =>
				create_message(
					`Pong! 🏓 ${Temporal.Now.instant()
						.since(timestamp)
						.total('milliseconds')}ms`
				)
		}
	]
];
