import { BoltCommand } from '../commands/mod.ts';
import { createBoltMessage } from '../utils.ts';
import {
	getBoltBridge,
	joinBoltBridge,
	leaveBoltBridge,
	resetBoltBridge
} from './utils.ts';

export const BoltBridgeCommands = [
	{
		name: 'bridgestatus',
		description: 'gets information about the current bridge',
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
	},
	{
		name: 'joinbridge',
		description: 'connect this channel to another',
		hasOptions: true,
		execute: async ({ bolt, channel, platform, arg: name }) =>
			(await joinBoltBridge(bolt, channel, platform, name)).message
	},
	{
		name: 'leavebridge',
		description: 'leaves the bridge this channel is connected to',
		execute: async ({ bolt, channel, platform }) =>
			(await leaveBoltBridge(bolt, channel, platform)).message
	},
	{
		name: 'resetbridge',
		description: 'leaves and rejoins the provided bridge',
		hasOptions: true,
		execute: async ({ bolt, channel, platform, arg: name }) =>
			await resetBoltBridge(bolt, channel, platform, name)
	}
] as BoltCommand[];
