import { BoltCommand } from '../commands/mod.ts';
import { createBoltMessage } from '../utils.ts';
import {
	joinBoltBridge,
	leaveBoltBridge,
	resetBoltBridge
} from './commandinternal.ts';
import { getBoltBridge } from './utils.ts';

export const BoltBridgeCommands = [
	{
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: () => {
			return createBoltMessage({
				content: `Try running \`!bolt help\` for help on bridges`
			});
		},
		options: {
			subcommands: [
				{
					name: 'join',
					description: 'join a bridge',
					execute: async ({ bolt, channel, platform, arg: name }) =>
						(await joinBoltBridge(bolt, channel, platform, name)).message,
					options: { hasArgument: true }
				},
				{
					name: 'leave',
					description: 'leave a bridge',
					execute: async ({ bolt, channel, platform }) =>
						(await leaveBoltBridge(bolt, channel, platform)).message,
					options: { hasArgument: true }
				},
				{
					name: 'reset',
					description: 'reset a bridge',
					execute: async ({ bolt, channel, platform, arg: name }) =>
						await resetBoltBridge(bolt, channel, platform, name),
					options: { hasArgument: true }
				},
				{
					name: 'status',
					description: "see what bridges you're in",
					execute: async ({ bolt, channel }) => {
						const data = await getBoltBridge(bolt, { channel });
						if (data?._id) {
							return createBoltMessage({
								content: `This channel is connected to \`${data._id}\``
							});
						} else {
							return createBoltMessage({
								content: "You're not in any bridges right now."
							});
						}
					}
				}
			]
		}
	}
] as BoltCommand[];
