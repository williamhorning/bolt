import { log_error } from '../errors.ts';
import type { lightning } from '../lightning.ts';
import type { deleted_message, message } from '../messages.ts';
import {
	get_channel_bridge,
	get_message_bridge,
	set_json,
} from './db_internals.ts';
import type { bridge_channel, bridge_message } from './types.ts';

export async function handle_message(
	lightning: lightning,
	msg: message | deleted_message,
	type: 'create_message' | 'edit_message' | 'delete_message',
): Promise<void> {
	await new Promise((res) => setTimeout(res, 150));

	if (type !== 'delete_message') {
		if (sessionStorage.getItem(`${msg.plugin}-${msg.id}`)) {
			return sessionStorage.removeItem(`${msg.plugin}-${msg.id}`)
		} else if (type === 'create_message') {
			lightning.emit(`create_nonbridged_message`, msg as message);
		}
	}

	const bridge = type === 'create_message'
		? await get_channel_bridge(lightning, msg.channel)
		: await get_message_bridge(lightning, msg.id);

	if (!bridge) return;

	if (type !== 'create_message' && bridge.allow_editing !== true) return;

	const channels = bridge.channels.filter(
		(i) => i.id !== msg.channel && i.plugin !== msg.plugin,
	);

	if (channels.length < 1) return;

	const messages = [] as bridge_message[];

	for (const channel of channels) {
		const index = bridge.channels.indexOf(channel);
		const bridged_id = bridge.messages?.[index];

		if (!channel.data || (type !== 'create_message' && !bridged_id)) continue;

		const plugin = lightning.plugins.get(channel.plugin);

		if (!plugin || !plugin[type]) {
			await log_error(
				new Error(`plugin ${channel.plugin} doesn't have ${type}`),
				{ channel, bridged_id },
			);
			continue;
		}

		let dat;

		const reply_id = await get_reply_id(lightning, msg as message, channel);

		try {
			dat = await plugin[type](
				msg as message,
				channel,
				bridged_id?.id!,
				reply_id,
			);
		} catch (e) {
			if (type === 'delete_message') continue;

			try {
				const err_msg = (await log_error(e, { channel, bridged_id })).message;

				dat = await plugin[type](err_msg, channel, bridged_id?.id!, reply_id);
			} catch (e) {
				await log_error(
					new Error(
						`Failed to send error for ${type} to ${channel.plugin}`,
						{ cause: e },
					),
					{ channel, bridged_id },
				);
				continue;
			}
		}

		sessionStorage.setItem(`${channel.plugin}-${dat}`, '1');

		messages.push({ id: dat, channel: channel.id, plugin: channel.plugin });
	}

	for (const i of messages) {
		await set_json(lightning, `lightning-bridged-${i.id}`, {
			...bridge,
			messages,
		});
	}

	await set_json(lightning, `lightning-bridged-${msg.id}`, {
		...bridge,
		messages,
	});
}

async function get_reply_id(
	lightning: lightning,
	msg: message,
	channel: bridge_channel,
) {
	if (msg.reply_id) {
		try {
			const bridged = await get_message_bridge(lightning, msg.reply_id);

			if (!bridged) return;

			const bridge_channel = bridged.messages?.find(
				(i) => i.channel === channel.id && i.plugin === channel.plugin,
			);

			return bridge_channel?.id;
		} catch {
			return;
		}
	}
	return;
}
