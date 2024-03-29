import type { lightning } from '../../lightning.ts';
import type { command_arguments } from '../types.ts';
import { create_message, log_error } from '../utils.ts';

export async function join(
	{ channel, platform, opts, commands }: command_arguments,
	l: lightning
) {
	const current = await l.bridge.get_bridge({ channel });

	if (current) {
		return {
			text: create_message(
				`You're already in a bridge. To learn more, run \`${commands.prefix} help\``
			)
		};
	}

	const _idraw = opts.name?.split(' ')[0];

	if (!_idraw) {
		return {
			text: create_message(
				`You need to name your bridge. Try \`${commands.prefix}\`bridge join --name <name>`
			)
		};
	}

	const _id = `bridge-${_idraw}`;
	const errorargs = { channel, platform, _id };
	const plugin = l.plugins.get(platform)!;

	const bridge = (await l.bridge.get_bridge({ _id })) || {
		_id,
		platforms: []
	};

	try {
		bridge.platforms.push({
			channel,
			plugin: platform,
			senddata: await plugin.create_bridge(channel)
		});
		await l.bridge.update_bridge(bridge);
		return {
			text: create_message('Joined a bridge!'),
			ok: true
		};
	} catch (e) {
		return { text: (await log_error(e, errorargs)).message };
	}
}

export async function leave(
	{ channel, platform, commands }: command_arguments,
	l: lightning
) {
	const current = await l.bridge.get_bridge({ channel });

	if (!current) {
		return {
			text: create_message(
				`To run this command you need to be in a bridge. To learn more, run \`${commands.prefix}help\`.`
			),
			ok: true
		};
	}

	try {
		await l.bridge.update_bridge({
			_id: current._id,
			platforms: current.platforms.filter(
				i => i.channel !== channel && i.plugin !== platform
			)
		});

		return {
			text: create_message('Left a bridge!'),
			ok: true
		};
	} catch (e) {
		return {
			text: (await log_error(e, { channel, platform, current })).message
		};
	}
}

export async function reset(args: command_arguments, l: lightning) {
	if (!args.opts.name) {
		const [_, ...rest] = ((await l.bridge.get_bridge(args))?._id || '').split(
			'bridge-'
		);
		args.opts.name = rest.join('bridge-');
	}
	let result = await leave(args, l);
	if (!result.ok) return result.text;
	result = await join(args, l);
	if (!result.ok) return result.text;
	return create_message('Reset this bridge!');
}

export async function toggle(args: command_arguments, l: lightning) {
	const current = await l.bridge.get_bridge(args);

	if (!current) {
		return create_message('You need to be in a bridge to toggle settings');
	}

	if (!args.opts.setting) {
		return create_message('You need to specify a setting to toggle');
	}

	if (!['realnames', 'editing_allowed'].includes(args.opts.setting)) {
		return create_message("That setting doesn't exist");
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
		await l.bridge.update_bridge(bridge);
		return create_message('Toggled that setting!');
	} catch (e) {
		return (await log_error(e, { ...args, bridge })).message;
	}
}

export async function status(args: command_arguments, l: lightning) {
	const current = await l.bridge.get_bridge(args);

	if (!current) {
		return create_message("You're not in any bridges right now.");
	}

	const settings_keys = Object.entries(current.settings || {}).filter(
		i => i[1]
	);

	const settings_text =
		settings_keys.length > 0
			? `as well as the following settings: \n\`${settings_keys.join('`, `')}\``
			: 'as well as no settings';

	return create_message(
		`This channel is connected to \`${current._id}\`, a bridge with ${
			current.platforms.length - 1
		} other channels connected to it, ${settings_text}`
	);
}
