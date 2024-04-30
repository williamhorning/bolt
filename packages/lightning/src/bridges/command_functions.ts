import type { lightning } from '../../lightning.ts';
import type { command_arguments } from '../types.ts';
import { log_error } from '../utils.ts';

export async function join(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	if (await l.bridge.is_in_bridge(opts.channel)) {
		return [
			false,
			"You're already in a bridge. To learn more, run the help command."
		];
	}

	const _id = opts.opts.name?.split(' ')[0];

	if (!_id) {
		return [
			false,
			'You need to name your bridge. To learn more, run the help command.'
		];
	}

	const plugin = l.plugins.get(opts.platform.name);
	const bridge = (await l.bridge.get_bridge({
		_id: `lightning-bridge-${_id}`
	})) || {
		_id,
		platforms: []
	};

	try {
		bridge.platforms.push({
			channel: opts.channel,
			plugin: opts.platform.name,
			senddata: await plugin!.create_bridge(opts.channel)
		});
		await l.bridge.set_bridge(bridge);
		return [true, 'Joined a bridge!'];
	} catch (e) {
		return [false, (await log_error(e, { opts, bridge })).message.content!];
	}
}

export async function leave(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	const bridge = await l.bridge.get_bridge({
		channel: opts.channel
	});

	if (!bridge) {
		return [
			true,
			"You're not in a bridge. To learn more, run the help command."
		];
	}

	try {
		await l.bridge.set_bridge({
			_id: bridge._id,
			platforms: bridge.platforms.filter(
				i => i.channel !== opts.channel && i.plugin !== opts.platform.name
			)
		});
		return [true, 'Left a bridge!'];
	} catch (e) {
		return [false, (await log_error(e, { opts, bridge })).message.content!];
	}
}

export async function reset(opts: command_arguments, l: lightning) {
	if (!opts.opts.name)
		opts.opts.name =
			(await l.bridge.get_bridge({ channel: opts.channel }))?._id ||
			opts.channel;

	let [ok, text] = await leave(opts, l);
	if (!ok) return text;
	[ok, text] = await join(opts, l);
	if (!ok) return text;
	return 'Reset this bridge!';
}

export async function toggle(opts: command_arguments, l: lightning) {
	const bridge = await l.bridge.get_bridge({ channel: opts.channel });

	if (!bridge) {
		return "You're not in a bridge right now. To learn more, run the help command";
	}

	if (!opts.opts.setting) {
		return 'You need to specify a setting to toggle';
	}

	if (!['realnames', 'editing_allowed'].includes(opts.opts.setting)) {
		return "That setting doesn't exist";
	}

	const setting = opts.opts.setting as 'realnames' | 'editing_allowed';

	bridge.settings = {
		...(bridge.settings || {}),
		[setting]: !(bridge.settings?.[setting] || false)
	};

	try {
		await l.bridge.set_bridge(bridge);
		return 'Toggled that setting!';
	} catch (e) {
		return (await log_error(e, { opts, bridge })).message.content!;
	}
}

export async function status(args: command_arguments, l: lightning) {
	const current = await l.bridge.get_bridge(args);

	if (!current) {
		return "You're not in any bridges right now.";
	}

	const settings_keys = Object.entries(current.settings || {}).filter(
		i => i[1]
	);

	const settings_text =
		settings_keys.length > 0
			? `as well as the following settings: \n\`${settings_keys.join('`, `')}\``
			: 'as well as no settings';

	return `This channel is connected to \`${current._id}\`, a bridge with ${
		current.platforms.length - 1
	} other channels connected to it, ${settings_text}`;
}
