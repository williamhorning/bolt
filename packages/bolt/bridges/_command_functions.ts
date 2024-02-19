import { command_arguments, Bolt, create_message, log_error } from './_deps.ts';

/** join a bridge */
export async function join(
	{ channel, platform, opts }: command_arguments,
	bolt: Bolt
) {
	const _id = `bridge-${opts.name?.split(' ')[0]}`;
	const current = await bolt.bridge.getBridge({ channel });
	const errorargs = { channel, platform, _id };
	const plugin = bolt.getPlugin(platform);

	if (current || !_id) {
		return {
			text: create_message({
				text: "to do this, you can't be in a bridge and need to name your bridge, see `!bolt help`"
			})
		};
	} else if (!plugin || !plugin.createSenddata) {
		return {
			text: (
				await log_error(new Error(`can't find plugin.senddata`), errorargs)
			).message
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
				text: create_message({ text: 'Joined a bridge!' }),
				ok: true
			};
		} catch (e) {
			return { text: (await log_error(e, errorargs)).message };
		}
	}
}

/** leave a bridge */
export async function leave(
	{ channel, platform }: command_arguments,
	bolt: Bolt
) {
	const current = await bolt.bridge.getBridge({ channel });

	if (!current) {
		return {
			text: create_message({
				text: 'To run this command you need to be in a bridge. To learn more, run `!bolt help`.'
			}),
			ok: true
		};
	} else {
		try {
			await bolt.bridge.updateBridge({
				_id: current._id,
				platforms: current.platforms.filter(
					i => i.channel !== channel && i.plugin !== platform
				)
			});

			return {
				text: create_message({ text: 'Left a bridge!' }),
				ok: true
			};
		} catch (e) {
			return {
				text: (await log_error(e, { channel, platform, current })).message
			};
		}
	}
}

/** reset a bridge (leave then join) */
export async function reset(args: command_arguments, bolt: Bolt) {
	if (!args.opts.name) {
		const [_, ...rest] = ((await bolt.bridge.getBridge(args))?._id || '').split(
			'bridge-'
		);
		args.opts.name = rest.join('bridge-');
	}
	let result = await leave(args, bolt);
	if (!result.ok) return result;
	result = await join(args, bolt);
	if (!result.ok) return result;
	return { text: create_message({ text: 'Reset this bridge!' }) };
}
