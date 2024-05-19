import { to_discord } from './conv.ts';
import type { API, bridge_channel, message } from './deps.ts';

export type channel = bridge_channel & {
	data: { token: string; id: string };
};

export async function webhook_on_discord(api: API, channel: string) {
	const { id, token } = await api.channels.createWebhook(channel, {
		name: 'bolt bridge'
	});

	return { id, token };
}

export async function send_to_discord(
	api: API,
	message: message,
	channel: channel,
	edit_id?: string,
	reply_id?: string
) {
	let replied_message;

	if (reply_id) {
		try {
			replied_message = await api.channels.getMessage(channel.id, reply_id);
		} catch {
			// safe to ignore
		}
	}

	const msg = await to_discord(message, replied_message);

	try {
		let wh;

		if (edit_id) {
			wh = await api.webhooks.editMessage(
				channel.data.id,
				channel.data.token,
				edit_id,
				msg
			);
		} else {
			wh = await api.webhooks.execute(channel.data.id, channel.data.token, msg);
		}

		return wh.id;
	} catch (e) {
		if (e.status === 404) {
			return '';
		} else {
			throw e;
		}
	}
}

export async function delete_on_discord(
	api: API,
	channel: channel,
	id: string
) {
	try {
		await api.webhooks.deleteMessage(channel.data.id, channel.data.token, id);
		return id;
	} catch (e) {
		if (e.status === 404) {
			return '';
		} else {
			throw e;
		}
	}
}
