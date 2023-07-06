import { BoltCommand, createBoltMessage } from './mod.ts';

export const BoltInfoCommands = [
	{
		name: 'help',
		description: 'get help with bolt',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `Looking for help with Bolt? Take a look at ${bolt.config.http.dashUrl}/docs`
			});
		}
	},
	{
		name: 'info',
		description: 'get information about bolt',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `Bolt 0.5 running on Deno with ${bolt.plugins.length} plugins, MongoDB, Redis, and other open-source software.`
			});
		}
	},
	{
		name: 'ping',
		description: 'pong',
		execute({ timestamp }) {
			console.log(timestamp);
			return createBoltMessage({
				content: `Pong! 🏓 ${Date.now() - timestamp}ms`
			});
		}
	},
	{
		name: 'dash',
		description: 'links to the bolt dashboard',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `You can find the Bolt dashboard at ${bolt.config.http.dashUrl}`
			});
		}
	}
] as BoltCommand[];
