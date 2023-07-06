import { Bolt } from '../bolt.ts';
import { BoltCommand, createBoltMessage } from '../commands/mod.ts';
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
		return "To run this command you can't be in a bridge. To learn more, run `!bolt help`.";
	}
	if (!name) {
		return 'Please provide a name for your bridge. To learn more, run `!bolt help`.';
	}
	const plugin = bolt.getPlugin(platform);
	if (!plugin?.createSenddata) {
		return `Error joining a bridge: can't find plugin ${platform}. Run \`!bolt help\` to get help.`;
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
		return `Can't join that bridge due to an error: Join the Bolt support server and share the following information:\n\`\`\`\n${e}\`\`\``;
	}
	return 'Joined a bridge!';
}

async function leaveBoltBridge(bolt: Bolt, channel: string, platform: string) {
	const current = await getBoltBridge(bolt, { channel });
	if (!current?._id) {
		return 'To run this command you need to be in a bridge. To learn more, run `!bolt help`.';
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
		return `Can't leave that bridge due to an error: Join the Bolt support server and share the following information:\n\`\`\`\n${e}\`\`\``;
	}
	return 'Left a bridge!';
}

export const BoltBridgeCommands = [
	{
		name: 'joinbridge',
		description: 'connect this channel to another',
		hasOptions: true,
		execute: async ({ bolt, channel, platform, arg: name }) => {
			return createBoltMessage({
				content: await joinBoltBridge(bolt, channel, platform, name)
			});
		}
	},
	{
		name: 'leavebridge',
		description: "leave's the bridge this channel is connected to",
		execute: async ({ bolt, channel, platform }) => {
			return createBoltMessage({
				content: await leaveBoltBridge(bolt, channel, platform)
			});
		}
	},
	{
		name: 'resetbridge',
		description: 'leaves and rejoins the provided bridge',
		hasOptions: true,
		execute: async ({ bolt, channel, platform, arg: name }) => {
			const current = await getBoltBridge(bolt, { channel });
			if (current?._id) {
				const result = await leaveBoltBridge(bolt, channel, platform);
				if (result !== 'Left a bridge!')
					return createBoltMessage({ content: result });
			}
			const result = await joinBoltBridge(bolt, channel, platform, name);
			if (result !== 'Joined a bridge!')
				return createBoltMessage({ content: result });
			return createBoltMessage({ content: 'Reset this bridge!' });
		}
	}
] as BoltCommand[];
