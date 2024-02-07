import { BoltCommandArguments } from './deps.ts';

export async function joinBoltBridge({
	bolt,
	channel,
	platform,
	opts
}: BoltCommandArguments) {
	const _id = opts.name?.split(' ')[0];
	const current = await bolt.bridge.getBridge({ channel });
	const errorargs = { channel, platform, _id };
	const plugin = bolt.getPlugin(platform);

	if (current || !_id) {
		return {
			text: bolt.createMsg({
				text: "to do this, you can't be in a bridge and need to name your bridge, see `!bolt help`"
			})
		};
	} else if (!plugin || !plugin.createSenddata) {
		return {
			text: await bolt.logError(
				new Error(`can't find plugin.senddata`),
				errorargs
			)
		};
	} else {
		const bridge = (await bolt.bridge.getBridge({ _id })) || {
			_id,
			platforms: []
		};
		try {
			bridge.platforms.push({
				channel,
				plugin: platform,
				senddata: await plugin.createSenddata(channel)
			});
			await bolt.bridge.updateBridge(bridge);
			return {
				text: bolt.createMsg({ text: 'Joined a bridge!' }),
				ok: true
			};
		} catch (e) {
			return { text: await bolt.logError(e, errorargs) };
		}
	}
}

export async function leaveBoltBridge({
	bolt,
	channel,
	platform
}: BoltCommandArguments) {
	const current = await bolt.bridge.getBridge({ channel });

	if (!current) {
		return {
			text: bolt.createMsg({
				text: 'To run this command you need to be in a bridge. To learn more, run `!bolt help`.'
			}),
			ok: true
		};
	} else {
		try {
			await bolt.bridge.updateBridge({
				_id: current._id,
				platforms: current.platforms.filter(
					i => i.channel === channel && i.plugin === platform
				)
			});

			return {
				text: bolt.createMsg({ text: 'Left a bridge!' }),
				ok: true
			};
		} catch (e) {
			return { text: await bolt.logError(e, { channel, platform, current }) };
		}
	}
}

export async function resetBoltBridge(args: BoltCommandArguments) {
	if (!args.opts.name) {
		args.opts.name =
			(await args.bolt.bridge.getBridge(args))?._id.slice(0, 7) || '';
	}
	let result = await leaveBoltBridge(args);
	if (!result.ok) return result;
	result = await joinBoltBridge(args);
	if (!result.ok) return result;
	return { text: args.bolt.createMsg({ text: 'Reset this bridge!' }) };
}
