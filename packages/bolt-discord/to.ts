import type { API, bridge_platform, message } from './deps.ts';
import { to_discord } from './conv.ts';

export type discord_platform = bridge_platform & {
	id: string;
	senddata: { token: string; id: string };
};

export async function webhook_on_discord(api: API, channel: string) {
	const { id, token } = await api.channels.createWebhook(channel, {
		name: 'bolt bridge'
	});

	return { id, token };
}

export async function send_to_discord(
	api: API,
	message: message<unknown>,
	plat: discord_platform,
	edit?: boolean
) {
	let replied_message;

	if (message.replytoid) {
		try {
			replied_message = await api.channels.getMessage(
				plat.channel,
				message.replytoid
			);
		} catch {
			// safe to ignore
		}
	}

	const msg = await to_discord(message, replied_message);

	try {
		let wh;

		if (edit) {
			wh = await api.webhooks.editMessage(
				plat.senddata.id,
				plat.senddata.token,
				plat.id,
				msg
			);
		} else {
			wh = await api.webhooks.execute(
				plat.senddata.id,
				plat.senddata.token,
				msg
			);
		}

		return { ...plat, id: wh.id };
	} catch (e) {
		if (e.status === 404) {
			return plat;
		} else {
			throw e;
		}
	}
}

export async function delete_on_discord(api: API, platform: discord_platform) {
	try {
		await api.webhooks.deleteMessage(
			platform.senddata.id,
			platform.senddata.token,
			platform.id
		);
		return platform;
	} catch (e) {
		if (e.status === 404) {
			return platform;
		} else {
			throw e;
		}
	}
}
