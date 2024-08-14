import { log_error } from '../errors.ts';
import type { lightning } from '../lightning.ts';
import type {
	bridge_channel,
	bridge_message,
	deleted_message,
	message,
	process_result,
} from '../types.ts';
import {
	get_channel_bridge,
	get_message_bridge,
	set_json,
} from './db_internals.ts';

export async function handle_message(
	lightning: lightning,
	msg: message | deleted_message,
	type: 'create_message' | 'edit_message' | 'delete_message',
): Promise<void> {
	await new Promise((res) => setTimeout(res, 150));

	if (type !== 'delete_message') {
		if (sessionStorage.getItem(`${msg.plugin}-${msg.id}`)) {
			return sessionStorage.removeItem(`${msg.plugin}-${msg.id}`);
		} else if (type === 'create_message') {
			lightning.emit(`create_nonbridged_message`, msg as message);
		}
	}

	const bridge = type === 'create_message'
		? await get_channel_bridge(lightning, msg.channel)
		: await get_message_bridge(lightning, msg.id);

	if (!bridge) return;

	if (
		bridge.channels.find((i) =>
			i.id === msg.channel && i.plugin === msg.plugin && i.disabled
		)
	) return;

	if (type !== 'create_message' && bridge.allow_editing !== true) return;

	const channels = bridge.channels.filter(
		(i) => i.id !== msg.channel || i.plugin !== msg.plugin,
	);

	if (channels.length < 1) return;

	const messages = [] as bridge_message[];

	for (const channel of channels) {
		if (!channel.data || channel.disabled) continue;

		const bridged_id = bridge.messages?.find((i) =>
			i.channel === channel.id && i.plugin === channel.plugin
		);

		if ((type !== 'create_message' && !bridged_id)) {
			continue;
		}

		const plugin = lightning.plugins.get(channel.plugin);

		if (!plugin) {
			await log_error(
				new Error(`plugin ${channel.plugin} doesn't exist`),
				{ channel, bridged_id },
			);
			continue;
		}

		let dat: process_result;

		const reply_id = await get_reply_id(lightning, msg as message, channel);

		try {
			dat = await plugin.process_message({
				// maybe find a better way to deal w/types
				action: type.replace('_message', '') as 'edit',
				channel,
				message: msg as message,
				edit_id: bridged_id?.id as string[],
				reply_id,
			});
		} catch (e) {
			dat = {
				channel,
				disable: false,
				error: e,
			};

			if (type === 'delete_message') continue;
		}

		if (dat.error) {
			if (type === 'delete_message') continue;

			if (dat.disable) {
				channel.disabled = true;

				bridge.channels = bridge.channels.map((i) => {
					if (i.id === channel.id && i.plugin === channel.plugin) {
						i.disabled = true;
					}
					return i;
				});

				await set_json(
					lightning,
					`lightning-bridge-${bridge.id}`,
					bridge,
				);

				await log_error(
					new Error(`disabled channel ${channel.id} on ${channel.plugin}`),
					{
						channel,
						dat,
						bridged_id,
					},
				);

				continue;
			}

			const logged = await log_error(dat.error, {
				channel,
				dat,
				bridged_id,
			});

			try {
				dat = await plugin.process_message({
					action: type.replace('_message', '') as 'edit',
					channel,
					message: logged.message,
					edit_id: bridged_id?.id as string[],
					reply_id,
				});

				if (dat.error) throw dat.error;
			} catch (e) {
				await log_error(
					new Error('failed to send error', { cause: e }),
					{ channel, dat, bridged_id, logged: logged.uuid },
				);

				continue;
			}
		}

		for (const i of dat.id) {
			sessionStorage.setItem(`${channel.plugin}-${i}`, '1');
		}

		messages.push({
			id: dat.id,
			channel: channel.id,
			plugin: channel.plugin,
		});
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

			if (!bridge_channel) return;

			return bridge_channel.id[0];
		} catch {
			return;
		}
	}
	return;
}
