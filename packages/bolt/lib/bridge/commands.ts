import { Bolt } from '../bolt.ts';
import { BoltCommand } from '../commands/mod.ts';
import { createBoltMessage, logBoltError } from '../utils.ts';
import { BoltBridgePlatform } from './types.ts';
import { getBoltBridge, updateBoltBridge } from './utils.ts';

async function joinBoltBridge(
	bolt: Bolt,
	channel: string,
	platform: string,
	name?: string
) {
	const current = await getBoltBridge(bolt, { channel });
	if (current?._id) {
		return {
			message: createBoltMessage({
				content:
					"To run this command you can't be in a bridge. To learn more, run `!bolt help`."
			}),
			code: 'InBridge'
		};
	}
	if (!name) {
		return {
			message: createBoltMessage({
				content:
					'Please provide a name for your bridge. To learn more, run `!bolt help`.'
			}),
			code: 'MissingParameter'
		};
	}
	const plugin = bolt.getPlugin(platform);
	if (!plugin?.createSenddata) {
		return logBoltError(bolt, {
			message: `Can't find plugin while creating bridge`,
			code: 'BridgeCreationNoPlugin',
			extra: { plugin, channel, platform, name, current }
		});
	}
	const bridge = (await getBoltBridge(bolt, { _id: name })) || {
		_id: `bridge-${name}`,
		name,
		platforms: []
	};
	try {
		const senddata = await plugin.createSenddata(channel);
		await updateBoltBridge(bolt, {
			...bridge,
			platforms: [
				...bridge.platforms,
				{
					channel,
					plugin: platform,
					senddata
				}
			]
		});
	} catch (e) {
		return logBoltError(bolt, {
			message: `Can't update this bridge`,
			cause: e,
			code: 'BridgeCreationCreateUpdateFailed',
			extra: { plugin, channel, platform, name, current }
		});
	}
	return {
		message: createBoltMessage({
			content: 'Joined a bridge!'
		}),
		code: 'OK'
	};
}

async function leaveBoltBridge(bolt: Bolt, channel: string, platform: string) {
	const current = await getBoltBridge(bolt, { channel });
	if (!current?._id) {
		return {
			message: createBoltMessage({
				content:
					'To run this command you need to be in a bridge. To learn more, run `!bolt help`.'
			}),
			code: 'NotInBridge',
			e: false
		};
	}
	try {
		await updateBoltBridge(bolt, {
			...current,
			platforms: current.platforms.filter(
				(i: BoltBridgePlatform) =>
					i.channel === channel && i.plugin === platform
			)
		});
	} catch (e) {
		return logBoltError(bolt, {
			cause: e,
			message: `Can't leave that bridge`,
			code: 'BridgeCreationLeaveFailed',
			extra: { channel, platform, current }
		});
	}
	return {
		message: createBoltMessage({ content: 'Left a bridge!' }),
		code: 'OK',
		e: false
	};
}

async function resetBoltBridge(
	bolt: Bolt,
	channel: string,
	platform: string,
	name?: string
) {
	const current = await getBoltBridge(bolt, { channel });
	if (current?._id) {
		const result = await leaveBoltBridge(bolt, channel, platform);
		if (result.code !== 'OK') return result.message;
	}
	const result = await joinBoltBridge(
		bolt,
		channel,
		platform,
		name || current?._id.substring(6)
	);
	if (result.code !== 'OK') return result.message;
	return createBoltMessage({ content: 'Reset this bridge!' });
}

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
