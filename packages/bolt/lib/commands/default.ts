import { createBoltMessage } from '../utils.ts';
import { BoltCommand } from './types.ts';

export default [
	{
		name: 'help',
		description: 'get help with bolt',
		execute: ({ commands }) => {
			return createBoltMessage({
				embeds: [
					{
						title: 'Bolt Help',
						description:
							"Here's some basic help. Take a look at [the docs](https://williamhorning.dev/bolt/docs) for more information.",
						fields: [
							{
								name: 'Commands',
								value: [...commands.commands.keys()]
									.map(i => `\`${i}\``)
									.join(', '),
								inline: true
							}
						]
					}
				]
			});
		},
		options: {
			default: true
		}
	},
	{
		name: 'info',
		description: 'get information about bolt',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `Bolt ${bolt.version} running on Deno ${Deno.version.deno} with ${bolt.plugins.length} plugins, MongoDB, Redis, and other open-source software.`
			});
		}
	},
	{
		name: 'ping',
		description: 'pong',
		execute({ timestamp }) {
			return createBoltMessage({
				content: `Pong! 🏓 ${Date.now() - timestamp}ms`
			});
		}
	},
	{
		name: 'site',
		description: 'links to the bolt site',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `You can find the Bolt site at ${bolt.config.http.dashURL}`
			});
		}
	}
] as BoltCommand[];
