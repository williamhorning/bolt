import { platforms, legacyBridgeDatabase, bridgeDatabase } from "../utils.js";

export async function isbridged(msg) {
	if (msg.platform === "guilded") {
		return (
			(msg.author.id === platforms.guilded.guilded.user.id &&
				msg.embeds &&
				!msg.replyto) ||
			(msg["platform.message"].createdByWebhookId &&
				(await bridgeDatabase.find({
					bridges: {
						platform: "guilded",
						senddata: {
							id: msg["platform.message"].createdByWebhookId,
						},
					},
				}))) ||
			(msg["platform.message"].createdByWebhookId &&
				(await legacyBridgeDatabase.find({
					id: msg["platform.message"].createdByWebhookId,
				})))
		);
	} else if (msg.platform === "discord") {
		return (
			(msg["platform.message"].webhookId &&
				(await legacyBridgeDatabase.find({
					id: msg["platform.message"].webhookId,
				}))) ||
			(await bridgeDatabase.find({
				bridges: {
					platform: "discord",
					senddata: { id: msg["platform.message"].webhookId },
				},
			}))
		);
	} else if (msg.platform === "revolt") {
		return (
			msg.author.id == platforms.revolt.revolt.user?._id &&
			msg["platform.message"].masquerade
		);
	}
}

export async function getBridges(msg) {
	return {
		legacy: await legacyBridgeDatabase.get(`${msg.platform}-${msg.channel}`),
		current: await bridgeDatabase.find({
			bridges: {
				platform: msg.platform,
				channel: msg.channel,
			},
		}),
	};
}
