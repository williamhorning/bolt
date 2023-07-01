import { mongoKV } from "@williamhorning/mongo-kv";
import { platforms, productname } from "../utils.js";

export const legacyBridgeDatabase = new mongoKV({
	url: "mongodb://localhost:27017",
	db: productname,
	collection: "bridge",
});

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
				"bridges.platform": "discord",
				"bridges.channel": msg.channel,
				"bridges.senddata.id": msg["platform.message"].webhookId,
			}))
		);
	} else if (msg.platform === "revolt") {
		return (
			msg.author.id == platforms.revolt.revolt.user?._id &&
			msg["platform.message"].masquerade
		);
	}
}

export async function getBridges({ platform, channel }) {
	let fwm = await bridgeDatabase.findWithMeta({
		"bridges.platform": platform,
		"bridges.channel": channel,
	});
	return {
		legacy: await legacyBridgeDatabase.get(`${platform}-${channel}`),
		current: { _id: fwm._id, ...fwm.value },
	};
}

export async function joinLegacy(name, channelId, platform, guild) {
	let id;
	if (platform === "discord") {
		const channel = await platforms.discord.discord.channels.fetch(channelId);
		if (channel.type !== "GUILD_TEXT") {
			throw new Error("Can't create a bridge here");
		}
		const a = await channel.createWebhook("bridge");
		id = {
			id: a.id,
			token: a.token,
		};
	} else if (platform === "guilded") {
		const a = await platforms.guilded.guilded.webhooks.createWebhook(guild, {
			channelId,
			name: "bridge",
		});
		id = {
			id: a.id,
			token: a.token,
		};
	} else if (platform === "revolt") {
		id = channelId;
	}
	await legacyBridgeDatabase.put(`${platform}-${name}`, id, {});
	await legacyBridgeDatabase.put(`${platform}-${channelId}`, name, {});
}

export async function leaveLegacy(name, channelId, platform) {
	await legacyBridgeDatabase.delete(`${platform}-${name}`);
	await legacyBridgeDatabase.delete(`${platform}-${channelId}`);
}
