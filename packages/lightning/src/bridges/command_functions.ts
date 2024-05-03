import type { lightning } from '../../lightning.ts';
import type { command_arguments } from '../types.ts';

export async function join(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	if (await l.bridge.is_in_bridge(opts.channel)) {
		return [
			false,
			"To do this, you can't be in a bridge. Try leaving your bridge first."
		];
	}

	const _id = opts.opts.name?.split(' ')[0];

	if (!_id) {
		return [
			false,
			'You need to provide a name your bridge. Try `join --name=<something>` instead.'
		];
	}

	const plugin = l.plugins.get(opts.platform);
	const bridge = (await l.bridge.get_bridge({
		_id: `lightning-bridge-${_id}`
	})) || {
		_id,
		platforms: []
	};

	bridge.platforms.push({
		channel: opts.channel,
		plugin: opts.platform,
		senddata: await plugin!.create_bridge(opts.channel)
	});

	await l.bridge.set_bridge(bridge);

	return [true, 'Joined a bridge!'];
}

export async function leave(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	const bridge = await l.bridge.get_bridge({
		channel: opts.channel
	});

	if (!bridge) {
		return [true, "You're not in a bridge, so try joining a bridge first."];
	}

	await l.bridge.set_bridge({
		_id: bridge._id,
		platforms: bridge.platforms.filter(
			i => i.channel !== opts.channel && i.plugin !== opts.platform
		)
	});

	return [true, 'Left a bridge!'];
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
		return "You're not in a bridge right now. Try joining one first.";
	}

	if (!opts.opts.setting) {
		return 'You need to specify a setting to toggle. Try `toggle --setting=<realnames|editing_allowed>` instead.';
	}

	if (!['realnames', 'editing_allowed'].includes(opts.opts.setting)) {
		return "That setting doesn't exist! Try `realnames` or `editing_allowed` instead.";
	}

	const setting = opts.opts.setting as 'realnames' | 'editing_allowed';

	bridge.settings = {
		...(bridge.settings || {}),
		[setting]: !(bridge.settings?.[setting] || false)
	};

	await l.bridge.set_bridge(bridge);

	return 'Toggled that setting!';
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
