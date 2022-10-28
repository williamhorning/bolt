import "dotenv/config";
import mongoKV from "@williamhorning/mongo-kv";
import argvParse from "@williamhorning/arg-parse";
import { boltError } from "./utils.js";
import discordClient from "./platforms/discord.js";
import guildedClient from "./platforms/guilded.js";
import revoltClient from "./platforms/revolt.js";

let prod = process.env.prod;

let productname = prod ? "bolt" : "bolt-canary";

let displayname = prod ? "Bolt" : "Bolt Canary";

let legacyBridgeDatabase = new mongoKV({
	url: "mongodb://localhost:27017",
	db: productname,
	collection: "bridge",
});

let bridgeDatabase = new mongoKV({
	url: "mongodb://localhost:27017",
	db: productname,
	collection: "bridgev1",
});

let discordClient = new discordClient({
	prod,
	token: process.env.DISCORD_TOKEN,
});

let guildedClient = new guildedClient({
	prod,
	token: process.env.GUILDED_TOKEN,
});

let revoltClient = new revoltClient({
	prod,
	token: process.env.REVOLT_TOKEN,
});

discordClient.on("msgcreate", msgCreate);
guildedClient.on("msgcreate", msgCreate);
revoltClient.on("msgcreate", msgCreate);

async function msgCreate(msg) {
	if (await isbridged(msg)) return;
	let bridgeIdentifierLegacy = await legacyBridgeDatabase.get(
		`${msg.platform}-${msg.channel}`
	);
	let thisbridge = await bridgeDatabase.find({
		"bridges.platform": msg.platform,
		"bridges.channel": msg.channel,
	});
	if (msg.content.startsWith("!bolt")) {
		commandhandle(msg, bridgeIdentifierLegacy, thisbridge);
	}
	if (bridgeIdentifierLegacy) {
		legacyBridgeSend(msg, bridgeIdentifierLegacy);
	}
	if (thisbridge?.bridges.length > 0) {
		bridgeSend(msg, thisbridge);
	}
}

async function bridgeSend(msg, thisbridge) {
	let bridges = thisbridge.bridges.filter((i) => {
		return !(i.platform == msg.platform && i.channel == msg.channel);
	});
	let sentmsgs = [];
	for (let i in bridges) {
		let bridge = bridges[i];
		sentmsgs.push(
			await (async () => {
				try {
					return await [`${bridge.platform}Client`].bridgeSend(
						msg,
						bridge.senddata
					);
				} catch (e) {
					return await [`${bridge.platform}Client`].bridgeSend(
						boltError(
							"bridge send",
							`send to ${bridge.platform}`,
							process.env.prod,
							e
						),
						bridge.senddata
					);
				}
			})()
		);
	}
	bridgeDatabase.put(`message-${msg.id}`, {
		message: {
			platform: msg.platform,
			channel: msg.channel,
			message: msg.id,
		},
		sent_to: sentmsgs,
	});
}

async function legacyBridgeSend(msg, bridgeIdentifierLegacy) {
	let platforms = ["discord", "guilded", "revolt"];
	platforms.splice(platforms.indexOf(msg.platform), 1);
	for (let platform of platforms) {
		let id = legacyBridgeDatabase.get(`${platform}-${bridgeIdentifierLegacy}`);
		if (!id) continue;
		let fnname =
			platform != "guilded" || (platform == "guilded" && id?.token)
				? "bridgeSend"
				: "idSend";
		try {
			await [`${platform}Client`][fnname](msg, id);
		} catch (e) {
			await [`${platform}Client`][fnname](
				boltError("bridge send", `send to ${platform}`, process.env.prod, e),
				id
			);
		}
	}
}

async function isbridged(msg) {
	if (msg.platform === "guilded") {
		return (
			(msg.author.id === guildedClient.guilded.user.id && msg.embeds) ||
			(msg["platform.message"].createdByWebhookId &&
				(await bridgeDatabase.find({
					"bridges.platform": "guilded",
					"bridges.senddata.id": msg["platform.message"].createdByWebhookId,
				}))) ||
			(await legacyBridgeDatabase.find({
				id: msg["platform.message"].createdByWebhookId,
			}))
		);
	} else if (msg.platform === "discord") {
		return (
			msg["platform.message"].webhookId &&
			((await legacyBridgeDatabase.find({
				id: msg["platform.message"].webhookId,
			})) ||
				(await bridgeDatabase.find({
					"bridges.platform": "discord",
					"bridges.senddata.id": msg["platform.message"].webhookId,
				})))
		);
	} else if (msg.platform === "revolt") {
		return (
			msg.author.id == revoltClient.revolt.user?._id &&
			msg["platform.message"].masquerade
		);
	}
}

// todo: rewrite this
async function commandhandle(msg, bridgeIdentifierLegacy) {
	let arg = argvParse(msg.content);
	try {
		let cmd = arg.commands.shift();
		if (cmd === "bridge") {
			if (arg.commands[0] === "legacy") {
				if (arg.commands[1] === "join") {
					if (!arg.commands[2]) {
						throw new Error("Please specify a bridge ID.");
					}
					try {
						if (bridgeIdentifierLegacy) {
							throw new Error("You already have a bridge set up.");
						} else if (arg.commands[2] == msg.channel) {
							throw new Error(
								"Due to a database bug, you can't name a bridge the channel ID."
							);
						}
						await legacyBridgeDatabase.put(
							`${msg.platform}-${msg.channel}`,
							arg.commands[2]
						);
						if (msg.platform == "discord") {
							let webhook = await msg["platform.message"].channel.createWebhook(
								"bridge"
							);
							await legacyBridgeDatabase.put(
								`${msg.platform}-${arg.commands[2]}`,
								{
									id: webhook.id,
									token: webhook.token,
								}
							);
						}
						if (msg.platform == "guilded") {
							let { webhook } =
								await guildedClient.guilded.rest.router.createWebhook(
									msg.guild,
									{
										name: "bridge",
										channelId: msg.channel,
									}
								);
							await legacyBridgeDatabase.put(
								`${msg.platform}-${arg.commands[2]}`,
								{
									id: webhook.id,
									token: webhook.token,
								}
							);
						}
						if (msg.platform == "revolt") {
							await legacyBridgeDatabase.put(
								`${msg.platform}-${arg.commands[2]}`,
								msg.channel
							);
						}
						await msg.reply("Bridge created, hopfully it works");
					} catch (e) {
						throw new Error(`Failed to join bridge: ${e.message || e}.`);
					}
				} else if (arg.commands[1] === "leave") {
					try {
						if (!bridgeIdentifierLegacy) throw new Error("No bridge found");
						await legacyBridgeDatabase.delete(
							`${msg.platform}-${bridgeIdentifierLegacy}`
						);
						await legacyBridgeDatabase.delete(`${msg.platform}-${msg.channel}`);
						await msg.reply("Bridge deleted");
					} catch (e) {
						throw new Error(`Failed to delete bridge: ${e.message}.`);
					}
				} else if (arg.commands[1] === "help") {
					await msg.reply(
						"Bridge commands:\n!bolt bridge legacy join <bridgeID>\n!bolt bridge legacy leave\nLegal: https://github.com/williamhorning/bolt/blob/main/legalese.md"
					);
				} else {
					throw new Error("Unknown command, try `!bolt bridge legacy help`.");
				}
			} else if (arg.commands[0] === "help") {
				await msg.reply(
					"bridge help: \n!bolt bridge legacy - bridge using the legacy system, not recommended"
				);
			} else {
				throw new Error("Unknown command, try `!bolt bridge help`.");
			}
		} else if (cmd === "help") {
			await msg.reply(
				"help: \n!bolt bridge legacy - bridge using the legacy system, not recommended\nLegal: https://github.com/williamhorning/bolt/blob/main/legalese.md"
			);
		} else {
			throw new Error("Unknown command, try `!bolt help`");
		}
	} catch (e) {
		await msg.reply(
			boltError("command handler", "unified", process.env.prod, e)
		);
	}
}
