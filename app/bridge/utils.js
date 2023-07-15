import { MongoClient } from "mongodb";
import { platforms, productname } from "../utils.js";

export const mongo = new MongoClient("mongodb://localhost:27017").db(
	productname
);

export async function isbridged(msg) {
	if (msg.platform === "guilded") {
		return (
			(msg.author.id === platforms.guilded.guilded.user.id &&
				msg.embeds &&
				!msg.replyto) ||
			(msg["platform.message"].createdByWebhookId &&
				(await mongo.collection("bridgev1").findOne({
					"value.bridges.platform": "guilded",
					"value.bridges.senddata.id":
						msg["platform.message"].createdByWebhookId,
				}))) ||
			(msg["platform.message"].createdByWebhookId &&
				(await mongo.collection("bridge").findOne({
					"value.id": msg["platform.message"].createdByWebhookId,
				})))
		);
	} else if (msg.platform === "discord") {
		return (
			(msg["platform.message"].webhookId &&
				(await mongo.collection("bridge").findOne({
					"value.id": msg["platform.message"].webhookId,
				}))) ||
			(await mongo.collection("bridgev1").findOne({
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
	const currentbridge = await mongo.collection("bridgev1").findOne({
		"value.bridges.platform": platform,
		"value.bridges.channel": channel,
	});
	return {
		legacy: await mongo
			.collection("bridge")
			.findOne({ _id: `${platform}-${channel}` }),
		current: currentbridge,
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
		const channel = await platforms.revolt.revolt.channels.fetch(channelId);
		if (!channel.havePermission("Masquerade"))
			throw new Error("Please enable masquerade permssions in this channel");
		id = channelId;
	}
	await mongo.collection("bridge").insertMany([
		{
			_id: `${platform}-${name}`,
			value: id,
		},
		{
			_id: `${platform}-${channelId}`,
			value: name,
		},
	]);
}

export async function leaveLegacy(name, channelId, platform) {
	await mongo.collection("bridge").deleteMany([
		{
			_id: `${platform}-${name}`,
		},
		{
			_id: `${platform}-${channelId}`,
		},
	]);
}
