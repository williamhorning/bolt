import { createBoltMessage } from '../utils.ts';
import { BoltCommand } from './mod.ts';

export const BoltInfoCommands = [
	{
		name: 'help',
		description: 'get help with bolt',
		execute: ({ bolt }) => {
			return createBoltMessage({
				content: `Looking for help with Bolt? Take a look at ${bolt.config.http.dashURL}/docs`
			});
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
