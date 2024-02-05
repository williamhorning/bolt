import { BoltCommand } from './deps.ts';
import {
	joinBoltBridge,
	leaveBoltBridge,
	resetBoltBridge
} from './bridge_command_internals.ts';

export const bridgecommands = [
	{
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: ({ bolt }) => {
			return bolt.createMsg({
				text: `Try running \`!bolt help\` for help`
			});
		},
		options: {
			subcommands: [
				{
					name: 'join',
					description: 'join a bridge',
					execute: async opts => (await joinBoltBridge(opts)).text,
					options: { hasArgument: true }
				},
				{
					name: 'leave',
					description: 'leave a bridge',
					execute: async opts => (await leaveBoltBridge(opts)).text
				},
				{
					name: 'reset',
					description: 'reset a bridge',
					execute: async opts => (await resetBoltBridge(opts)).text,
					options: { hasArgument: true }
				},
				{
					name: 'status',
					description: "see what bridges you're in",
					execute: async ({ bolt, channel }) => {
						const data = await bolt.bridge.getBridge({ channel });
						if (data?._id) {
							return bolt.createMsg({
								text: `This channel is connected to \`${data._id}\``
							});
						} else {
							return bolt.createMsg({
								text: "You're not in any bridges right now."
							});
						}
					}
				}
			]
		}
	}
] as BoltCommand[];
