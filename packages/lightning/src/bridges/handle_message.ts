import type { lightning } from '../../lightning.ts';
import type { message, deleted_message, bridge_channel } from '../types.ts';
import { log_error } from '../utils.ts';

export async function handle_message(
	lightning: lightning,
	msg: message<unknown> | deleted_message<unknown>,
	type: 'create_message' | 'edit_message' | 'delete_message'
): Promise<void> {
	const bridge =
		type === 'create_message'
			? await lightning.bridge.get_bridge(msg)
			: await lightning.bridge.get_bridge_message(msg.id);

	if (!bridge) return;

	if (type !== 'create_message' && bridge.allow_editing !== true) return;

	if (!bridge.channels || bridge.channels.length < 1) return;

	const messages = [];

	for (const index in bridge.channels) {
		const platform = bridge.channels[index];
		const bridged_id = bridge.messages?.[index];

		if (!platform.data || (type !== 'create_message' && !bridged_id)) continue;

		const plugin = lightning.plugins.get(platform.plugin);

		if (!plugin || !plugin[type]) {
			await log_error(
				new Error(`plugin ${platform.plugin} doesn't have ${type}_message`),
				{ platform, bridged_id }
			);
			continue;
		}

		let dat;

		const reply_id = await get_reply_id(
			lightning,
			msg as message<unknown>,
			platform
		);

		try {
			dat = await plugin[type](
				msg as message<unknown>,
				platform,
				bridged_id!,
				reply_id
			);
		} catch (e) {
			if (type === 'delete_message') continue;

			try {
				const err_msg = (await log_error(e, { platform, bridged_id })).message;

				dat = await plugin[type](err_msg, platform, bridged_id!, reply_id);
			} catch (e) {
				await log_error(
					new Error(
						`Failed to send error for ${type}_message to ${platform.plugin}`,
						{ cause: e }
					),
					{ platform, bridged_id }
				);
				continue;
			}
		}

		await lightning.redis.sendCommand([
			'SET',
			`lightning-isbridged-${dat}`,
			'1'
		]);

		messages.push(dat);
	}

	for (const i of messages) {
		await lightning.redis.sendCommand([
			'SET',
			`lightning-bridged-${i}`,
			JSON.stringify({ ...bridge, messages })
		]);
	}

	await lightning.redis.sendCommand([
		'SET',
		`lightning-bridged-${msg.id}`,
		JSON.stringify({ ...bridge, messages })
	]);
}

async function get_reply_id(
	lightning: lightning,
	msg: message<unknown>,
	channel: bridge_channel
) {
	if ('replytoid' in msg && msg.replytoid) {
		try {
			const bridge_from_msg = await lightning.bridge.get_bridge_message(
				msg.replytoid
			);

			if (!bridge_from_msg) return;

			const bridge_channel = bridge_from_msg.channels.find(
				i => i.id === channel.id && i.plugin === channel.plugin
			);

			if (!bridge_channel) return;

			return bridge_from_msg.messages![
				bridge_from_msg.channels.indexOf(bridge_channel)
			];
		} catch {
			return;
		}
	}
}
