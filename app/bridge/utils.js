import { mongoKV } from "@williamhorning/mongo-kv";
import { platforms, productname } from "../utils.js";

export const bridgeDatabase = new mongoKV({
	url: "mongodb://localhost:27017",
	db: productname,
	collection: "bridgev1",
});

export async function isbridged(msg) {
	if (msg.platform === "guilded") {
		return (
			(msg.author.id === platforms.guilded.guilded.user.id &&
				msg.embeds &&
				!msg.replyto) ||
			(msg["platform.message"].createdByWebhookId &&
				(await bridgeDatabase.find({
					"bridges.platform": "guilded",
					"bridges.senddata.id": msg["platform.message"].createdByWebhookId,
				})))
		);
	} else if (msg.platform === "discord") {
		return await bridgeDatabase.find({
			"bridges.platform": "discord",
			"bridges.channel": msg.channel,
			"bridges.senddata.id": msg["platform.message"].webhookId,
		});
	} else if (msg.platform === "revolt") {
		return (
			msg.author.id == platforms.revolt.revolt.user?._id &&
			msg["platform.message"].masquerade
		);
	}
}

export async function getBridge(msg) {
	let bridge = await bridgeDatabase.findWithMeta({
		"bridges.platform": msg.platform,
		"bridges.channel": msg.channel,
	});
	if (bridge == "undefined" || bridge._id == "undefined") return;
	return { _id: bridge._id, ...bridge.value };
}
