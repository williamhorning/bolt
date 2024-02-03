export const defaultcommands = [
	{
		name: 'help',
		description: 'get help with bolt',
		execute: ({ commands, bolt }) => {
			return bolt.createMsg({
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
			return bolt.createMsg({
				content: `Bolt ${bolt.version} running with 3 platforms, MongoDB, and other open-source software.`
			});
		}
	},
	{
		name: 'ping',
		description: 'pong',
		execute({ timestamp, bolt }) {
			return bolt.createMsg({
				content: `Pong! 🏓 ${Date.now() - timestamp}ms`
			});
		}
	},
	{
		name: 'site',
		description: 'links to the bolt site',
		execute: ({ bolt }) => {
			return bolt.createMsg({
				content: `You can find the Bolt site at https://williamhorning.dev/bolt`
			});
		}
	}
];

export { bridgecommands } from './bridge_commands.js';
