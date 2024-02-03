import {
	joinBoltBridge,
	leaveBoltBridge,
	resetBoltBridge
} from './bridge_command_internals.js';

export const bridgecommands = [
	{
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: ({ bolt }) => {
			return bolt.createMsg({
				content: `Try running \`!bolt help\` for help on bridges`
			});
		},
		options: {
			subcommands: [
				{
					name: 'join',
					description: 'join a bridge',
					execute: async opts => (await joinBoltBridge(opts)).message,
					options: { hasArgument: true }
				},
				{
					name: 'leave',
					description: 'leave a bridge',
					execute: async opts => (await leaveBoltBridge(opts)).message
				},
				{
					name: 'reset',
					description: 'reset a bridge',
					execute: async opts => (await resetBoltBridge(opts)).message,
					options: { hasArgument: true }
				},
				{
					name: 'status',
					description: "see what bridges you're in",
					execute: async ({ bolt, channel }) => {
						const data = await bolt.bridge.getBridge({ channel });
						if (data?._id) {
							return bolt.createMsg({
								content: `This channel is connected to \`${data._id}\``
							});
						} else {
							return bolt.createMsg({
								content: "You're not in any bridges right now."
							});
						}
					}
				}
			]
		}
	}
];
