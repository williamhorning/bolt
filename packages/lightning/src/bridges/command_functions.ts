import type { lightning } from '../lightning.ts';
import type { command_arguments } from '../types.ts';

export async function join(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	if (await l.bridges.is_in_bridge(opts.channel)) {
		return [
			false,
			"To do this, you can't be in a bridge. Try leaving your bridge first."
		];
	}

	const id = opts.opts.name?.split(' ')[0];

	if (!id) {
		return [
			false,
			'You need to provide a name your bridge. Try `join --name=<something>` instead.'
		];
	}

	const plugin = l.plugins.get(opts.plugin);

	const bridge = (await l.bridges.get_bridge({
		id
	})) || {
		allow_editing: false,
		channels: [],
		id,
		use_rawname: false
	};

	bridge.channels.push({
		id: opts.channel,
		plugin: opts.plugin,
		data: await plugin!.create_bridge(opts.channel)
	});

	await l.bridges.set_bridge(bridge);

	await l.redis.sendCommand([
		'SET',
		`lightning-bchannel-${opts.channel}`,
		bridge.id
	]);

	return [true, 'Joined a bridge!'];
}

export async function leave(
	opts: command_arguments,
	l: lightning
): Promise<[boolean, string]> {
	const bridge = await l.bridges.get_bridge({
		channel: opts.channel
	});

	if (!bridge) {
		return [true, "You're not in a bridge, so try joining a bridge first."];
	}

	await l.bridges.set_bridge({
		...bridge,
		channels: bridge.channels.filter(
			i => i.id !== opts.channel && i.plugin !== opts.plugin
		)
	});

	await l.redis.sendCommand(['DEL', `lightning-bchannel-${opts.channel}`]);

	return [true, 'Left a bridge!'];
}

export async function reset(opts: command_arguments, l: lightning) {
	if (!opts.opts.name)
		opts.opts.name =
			(await l.bridges.get_bridge({ channel: opts.channel }))?.id ||
			opts.channel;

	let [ok, text] = await leave(opts, l);
	if (!ok) return text;
	[ok, text] = await join(opts, l);
	if (!ok) return text;
	return 'Reset this bridge!';
}

export async function toggle(opts: command_arguments, l: lightning) {
	const bridge = await l.bridges.get_bridge({ channel: opts.channel });

	if (!bridge) {
		return "You're not in a bridge right now. Try joining one first.";
	}

	if (!opts.opts.setting) {
		return 'You need to specify a setting to toggle. Try `toggle --setting=<allow_editing|use_rawname>` instead.';
	}

	if (!['allow_editing', 'use_rawname'].includes(opts.opts.setting)) {
		return "That setting doesn't exist! Try `allow_editing` or `use_rawname` instead.";
	}

	const setting = opts.opts.setting as 'allow_editing' | 'use_rawname';

	bridge[setting] = !bridge[setting];

	await l.bridges.set_bridge(bridge);

	return 'Toggled that setting!';
}

export async function status(args: command_arguments, l: lightning) {
	const current = await l.bridges.get_bridge({ channel: args.channel });

	if (!current) {
		return "You're not in any bridges right now.";
	}

	const editing_text = current.allow_editing
		? 'with editing enabled'
		: 'with editing disabled';
	const rawname_text = current.use_rawname
		? 'and nicknames disabled'
		: 'and nicknames enabled';

	return `This channel is connected to \`${current.id}\`, a bridge with ${
		current.channels.length - 1
	} other channels connected to it, ${editing_text} ${rawname_text}`;
}
