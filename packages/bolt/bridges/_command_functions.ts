import { Bolt, command_arguments, create_message, log_error } from './_deps.ts';

/** join a bridge */
export async function join(
	{ channel, platform, opts }: command_arguments,
	bolt: Bolt
) {
	const _idraw = opts.name?.split(' ')[0];
	const _id = `bridge-${_idraw}`;
	const current = await bolt.bridge.get_bridge({ channel });
	const errorargs = { channel, platform, _id };
	const plugin = bolt.plugins.get(platform);

	if (current || !_idraw) {
		return {
			text: create_message({
				text: "to do this, you can't be in a bridge and need to name your bridge, see `!bolt help`"
			})
		};
	} else if (!plugin || !plugin.create_bridge) {
		return {
			text: (
				await log_error(new Error("can't find plugin#create_bridge"), errorargs)
			).message
		};
	} else {
		const bridge = (await bolt.bridge.get_bridge({ _id })) || {
			_id,
			platforms: []
		};
		try {
			bridge.platforms.push({
				channel,
				plugin: platform,
				senddata: await plugin.create_bridge(channel)
			});
			await bolt.bridge.update_bridge(bridge);
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
	const current = await bolt.bridge.get_bridge({ channel });

	if (!current) {
		return {
			text: create_message({
				text: 'To run this command you need to be in a bridge. To learn more, run `!bolt help`.'
			}),
			ok: true
		};
	} else {
		try {
			await bolt.bridge.update_bridge({
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
		const [_, ...rest] = (
			(await bolt.bridge.get_bridge(args))?._id || ''
		).split('bridge-');
		args.opts.name = rest.join('bridge-');
	}
	let result = await leave(args, bolt);
	if (!result.ok) return result;
	result = await join(args, bolt);
	if (!result.ok) return result;
	return { text: create_message({ text: 'Reset this bridge!' }) };
}

/** toggle a setting on a bridge */
export async function toggle(args: command_arguments, bolt: Bolt) {
	const current = await bolt.bridge.get_bridge(args);

	if (!current) {
		return {
			text: create_message({
				text: 'You need to be in a bridge to toggle settings'
			})
		};
	}

	if (!args.opts.setting) {
		return {
			text: create_message({
				text: 'You need to specify a setting to toggle'
			})
		};
	}

	if (!['realnames', 'editing_allowed'].includes(args.opts.setting)) {
		return {
			text: create_message({ text: "That setting doesn't exist" })
		};
	}

	const setting = args.opts.setting as 'realnames' | 'editing_allowed';

	const bridge = {
		...current,
		settings: {
			...(current.settings || {}),
			[args.opts.setting]: !(current.settings?.[setting] || false)
		}
	};

	try {
		await bolt.bridge.update_bridge(bridge);
		return {
			text: create_message({ text: 'Toggled that setting!' })
		};
	} catch (e) {
		return {
			text: (await log_error(e, { ...args, bridge })).message
		};
	}
}

export async function status(args: command_arguments, bolt: Bolt) {
	const current = await bolt.bridge.get_bridge(args);

	if (!current) {
		return {
			text: create_message({
				text: "You're not in any bridges right now."
			})
		};
	}

	const settings_keys = Object.entries(current.settings || {}).filter(
		i => i[1]
	);

	const settings_text =
		settings_keys.length > 0
			? `as well as the following settings: \n\`${settings_keys.join('`, `')}\``
			: 'as well as no settings';

	return {
		text: create_message({
			text: `This channel is connected to \`${current._id}\`, a bridge with ${
				current.platforms.length - 1
			} other channels connected to it, ${settings_text}`
		})
	};
}
