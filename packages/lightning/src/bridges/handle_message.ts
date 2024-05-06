import type { lightning } from '../lightning.ts';
import type {
	bridge_channel,
	bridge_message,
	deleted_message,
	message
} from '../types.ts';
import { log_error } from '../utils.ts';

export async function handle_message(
	lightning: lightning,
	msg: message | deleted_message,
	type: 'create_message' | 'edit_message' | 'delete_message'
): Promise<void> {
	const bridge =
		type === 'create_message'
			? await lightning.bridges.get_bridge(msg)
			: await lightning.bridges.get_bridge_message(msg.id);

	if (!bridge) return;

	if (type !== 'create_message' && bridge.allow_editing !== true) return;

	const channels = bridge.channels.filter(
		i => i.id !== msg.channel && i.plugin !== msg.plugin
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
				new Error(`plugin ${channel.plugin} doesn't have ${type}_message`),
				{ channel, bridged_id }
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
				reply_id
			);
		} catch (e) {
			if (type === 'delete_message') continue;

			try {
				const err_msg = (await log_error(e, { channel, bridged_id })).message;

				dat = await plugin[type](err_msg, channel, bridged_id?.id!, reply_id);
			} catch (e) {
				await log_error(
					new Error(
						`Failed to send error for ${type}_message to ${channel.plugin}`,
						{ cause: e }
					),
					{ channel, bridged_id }
				);
				continue;
			}
		}

		await lightning.redis.sendCommand([
			'SET',
			`lightning-isbridged-${dat}`,
			'1'
		]);

		messages.push({ id: dat, channel: channel.id, plugin: channel.plugin });
	}

	for (const i of messages) {
		await lightning.redis.sendCommand([
			'SET',
			`lightning-bridged-${i.id}`,
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
	msg: message,
	channel: bridge_channel
) {
	if (msg.reply_id) {
		try {
			const bridged = await lightning.bridges.get_bridge_message(msg.reply_id);

			if (!bridged) return;

			const bridge_channel = bridged.messages?.find(
				i => i.channel === channel.id && i.plugin === channel.plugin
			);

			return bridge_channel?.id;
		} catch {
			return;
		}
	}
	return;
}
