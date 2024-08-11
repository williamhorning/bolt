import type { command_arguments } from '../commands.ts';
import { log_error } from '../errors.ts';
import {
	del_key,
	get_bridge,
	get_channel_bridge,
	set_bridge,
} from './db_internals.ts';

export async function join(
	opts: command_arguments,
): Promise<[boolean, string]> {
	if (
		await get_channel_bridge(
			opts.lightning,
			`lightning-bchannel-${opts.channel}`,
		)
	) {
		return [
			false,
			"To do this, you can't be in a bridge. Try leaving your bridge first.",
		];
	}

	const id = opts.opts.name?.split(' ')[0];

	if (!id) {
		return [
			false,
			'You need to provide a name your bridge. Try `join --name=<something>` instead.',
		];
	}

	const plugin = opts.lightning.plugins.get(opts.plugin);

	const bridge = (await get_bridge(opts.lightning, id)) || {
		allow_editing: false,
		channels: [],
		id,
		use_rawname: false,
	};

	try {
		const data = await plugin!.create_bridge(opts.channel);

		bridge.channels.push({
			id: opts.channel,
			disabled: false,
			plugin: opts.plugin,
			data,
		});

		await set_bridge(opts.lightning, bridge);

		return [true, 'Joined a bridge!'];
	} catch (e) {
		const err = await log_error(e, { opts });
		return [false, err.message.content!];
	}
}

export async function leave(
	opts: command_arguments,
): Promise<[boolean, string]> {
	const bridge = await get_channel_bridge(opts.lightning, opts.channel);

	if (!bridge) {
		return [true, "You're not in a bridge, so try joining a bridge first."];
	}

	await set_bridge(opts.lightning, {
		...bridge,
		channels: bridge.channels.filter(
			(i) => i.id !== opts.channel && i.plugin !== opts.plugin,
		),
	});

	await del_key(opts.lightning, `lightning-bchannel-${opts.channel}`);

	return [true, 'Left a bridge!'];
}

export async function reset(opts: command_arguments) {
	if (!opts.opts.name) {
		opts.opts.name =
			(await get_channel_bridge(opts.lightning, opts.channel))?.id ||
			opts.channel;
	}

	let [ok, text] = await leave(opts);
	if (!ok) return text;
	[ok, text] = await join(opts);
	if (!ok) return text;
	return 'Reset this bridge!';
}

export async function toggle(opts: command_arguments) {
	const bridge = await get_channel_bridge(opts.lightning, opts.channel);

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

	await set_bridge(opts.lightning, bridge);

	return 'Toggled that setting!';
}

export async function status(args: command_arguments) {
	const current = await get_channel_bridge(args.lightning, args.channel);

	if (!current) {
		return "You're not in any bridges right now.";
	}

	return `This channel is connected to \`${current.id}\`, a bridge with ${
		current.channels.length - 1
	} other channels connected to it, with editing ${
		current.allow_editing ? 'enabled' : 'disabled'
	} and nicknames ${current.use_rawname ? 'disabled' : 'enabled'}`;
}
