import "dotenv/config";
import { mongoKV } from "@williamhorning/mongo-kv";
import argvParse from "@williamhorning/arg-parse";
import { boltError , boltErrorButExit} from "./utils.js";
import dsc from "./platforms/discord.js";
import gld from "./platforms/guilded.js";
import rvl from "./platforms/revolt.js";

process.on("uncaughtException", boltErrorButExit)
process.on("unhandledRejection", boltErrorButExit)

let prod = process.env.prod;

let productname = prod ? "bolt" : "bolt-canary";

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

let things = {
	discord: new dsc({
		prod,
		token: process.env.DISCORD_TOKEN,
	}),
	guilded: new gld({
		prod,
		token: process.env.GUILDED_TOKEN,
	}),
	revolt: new rvl({
		prod,
		token: process.env.REVOLT_TOKEN,
	}),
};

things.discord.on("msgcreate", msgCreate);
things.guilded.on("msgcreate", msgCreate);
things.revolt.on("msgcreate", msgCreate);

async function msgCreate(msg) {
	if (await isbridged(msg)) return;

	let bridgeIdentifierLegacy = await legacyBridgeDatabase.get(
		`${msg.platform}-${msg.channel}`
	);

	let thisbridge = await bridgeDatabase.find({
		bridges: {
			platform: msg.platform,
			channel: msg.channel,
		},
	});

	if (msg.content.startsWith("!bolt")) {
		commandhandle(msg, bridgeIdentifierLegacy, thisbridge);
	}

	if (bridgeIdentifierLegacy) {
		legacyBridgeSend(msg, bridgeIdentifierLegacy);
	}

	/*
	if (thisbridge?.bridges.length > 0) {
		bridgeSend(msg, thisbridge);
	}*/
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
					return await things[msg.platform].bridgeSend(msg, bridge.senddata);
				} catch (e) {
					return await things[msg.platform].bridgeSend(
						boltError(`message via bridge to ${platform}`, productname, e),
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
		let id = await legacyBridgeDatabase.get(
			`${platform}-${bridgeIdentifierLegacy}`
		);
		if (!id) continue;
		let fnname =
			platform != "guilded" || (platform == "guilded" && id?.token)
				? "bridgeSend"
				: "idSend";
		try {
			await things[platform][fnname](msg, id);
		} catch (e) {
			await things[platform][fnname](
				boltError(`legacy message via bridge to ${platform}`, productname, e),
				id
			);
		}
	}
}

async function isbridged(msg) {
	if (msg.platform === "guilded") {
		return (
			(msg.author.id === things.guilded.guilded.user.id && msg.embeds) ||
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
			msg["platform.message"].webhookId &&
			((await legacyBridgeDatabase.find({
				id: msg["platform.message"].webhookId,
			})) ||
				(await bridgeDatabase.find({
					bridges: {
						platform: "discord",
						senddata: { id: msg["platform.message"].webhookId },
					},
				})))
		);
	} else if (msg.platform === "revolt") {
		return (
			msg.author.id == things.revolt.revolt.user?._id &&
			msg["platform.message"].masquerade
		);
	}
}

// todo: rewrite this
async function commandhandle(msg, bridgeIdentifierLegacy) {
	let arg = argvParse(msg.content);
	arg._.shift();
	let cmd = arg._.shift();
	try {
		if (cmd === "bridge") {
			if (arg._[0] === "legacy") {
				if (arg._[1] === "join") {
					if (!arg._[2]) {
						throw new Error("Please specify a bridge ID");
					}
					try {
						if (bridgeIdentifierLegacy) {
							throw new Error("You already have a bridge set up");
						} else if (arg._[2] == msg.channel) {
							throw new Error(
								"Due to a database bug, you can't name a bridge the channel ID"
							);
						}
						await legacyBridgeDatabase.put(
							`${msg.platform}-${msg.channel}`,
							arg._[2]
						);
						if (msg.platform == "discord") {
							let webhook = await msg["platform.message"].channel.createWebhook(
								"bridge"
							);
							await legacyBridgeDatabase.put(`${msg.platform}-${arg._[2]}`, {
								id: webhook.id,
								token: webhook.token,
							});
						}
						if (msg.platform == "guilded") {
							let { webhook } =
								await things.guilded.guilded.rest.router.createWebhook(
									msg.guild,
									{
										name: "bridge",
										channelId: msg.channel,
									}
								);
							await legacyBridgeDatabase.put(`${msg.platform}-${arg._[2]}`, {
								id: webhook.id,
								token: webhook.token,
							});
						}
						if (msg.platform == "revolt") {
							await legacyBridgeDatabase.put(
								`${msg.platform}-${arg._[2]}`,
								msg.channel
							);
						}
						await msg.reply("Bridge created, hopfully it works");
					} catch (e) {
						throw new Error(`Failed to join bridge: ${e.message || e}`);
					}
				} else if (arg._[1] === "leave") {
					try {
						if (!bridgeIdentifierLegacy) throw new Error("No bridge found");
						await legacyBridgeDatabase.delete(
							`${msg.platform}-${bridgeIdentifierLegacy}`
						);
						await legacyBridgeDatabase.delete(`${msg.platform}-${msg.channel}`);
						await msg.reply("Bridge deleted");
					} catch (e) {
						throw new Error(`Failed to delete bridge: ${e.message}`);
					}
				} else if (arg._[1] === "help") {
					await msg.reply(
						"Bridge _:\n!bolt bridge legacy join <bridgeID>\n!bolt bridge legacy leave\nLegal: https://github.com/williamhorning/bolt/blob/main/legalese.md"
					);
				} else {
					throw new Error("Unknown command");
				}
			} else if (arg._[0] === "help") {
				await msg.reply(
					"bridge help: \n!bolt bridge legacy - bridge using the legacy system, not recommended"
				);
			} else {
				throw new Error("Unknown command");
			}
		} else if (cmd === "ping") {
			await msg.reply(`Ping! - ${Date.now() - msg.timestamp}ms`);
		} else if (cmd === "help") {
			await msg.reply(
				"help: \n!bolt bridge legacy - bridge using the legacy system, not recommended\nLegal: https://github.com/williamhorning/bolt/blob/main/legalese.md"
			);
		} else {
			throw new Error("Unknown command");
		}
	} catch (e) {
		await msg.reply(boltError(`${e.message || e}`, productname, e));
	}
}
