import { argvParse, boltError, mongoKV } from "./utils.js";
import discordClient from "./platforms/discord.js";
import guildedClient from "./platforms/guilded.js";
import revoltClient from "./platforms/revolt.js";

export class client {
	constructor() {
		this.productname = process.env.prod ? "bolt" : "bolt-canary";
		
		this.displayname = process.env.prod ? "Bolt" : "Bolt Canary";

		this.legacyBridgeDatabase = new mongoKV({
			url: "mongodb://localhost:27017",
			db: this.productname,
			collection: "bridge",
		});

		this.bridgedatabase = new mongoKV({
			url: "mongodb://localhost:27017",
			db: this.productname,
			collection: "bridgev1",
		});

		this.discord = new discordClient({
			prod: process.env.prod,
			token: process.env.DISCORD_TOKEN,
		});

		this.guilded = new guildedClient({
			prod: process.env.prod,
			token: process.env.GUILDED_TOKEN,
		});

		this.revolt = new revoltClient({
			prod: process.env.prod,
			token: process.env.REVOLT_TOKEN,
		});

		this.discord.on("msgcreate", this.msgCreate.bind(this));
		this.guilded.on("msgcreate", this.msgCreate.bind(this));
		this.revolt.on("msgcreate", this.msgCreate.bind(this));
		// todo: deal with the msgedit and msgdelete events
	}

	async msgCreate(msg) {
		if (await this.isbridged(msg)) return;
		let bridgeIdentifierLegacy = await this.legacyBridgeDatabase.get(
			`${msg.platform}-${msg.channel}`
		);
		let thisbridge = await this.bridgedatabase.find({
			"bridges.platform": msg.platform,
			"bridges.channel": msg.channel,
		});
		if (msg.content.startsWith("!bolt")) {
			this.commandhandle(msg, bridgeIdentifierLegacy, thisbridge);
		}
		if (bridgeIdentifierLegacy) {
			this.legacybridgeSend(msg, bridgeIdentifierLegacy);
		}
		if (thisbridge?.bridges.length > 0) {
			this.bridgeSend(msg, thisbridge);
		}
	}

	async legacybridgeSend(msg, bridgeIdentifierLegacy) {
		let platforms = ["discord", "guilded", "revolt"];
		platforms.splice(platforms.indexOf(msg.platform), 1);
		for (let platform of platforms) {
			let id = await this.legacyBridgeDatabase.get(
				`${platform}-${bridgeIdentifierLegacy}`
			);
			if (!id) continue;
			if (platform !== "guilded" || (platform == "guilded" && id?.token)) {
				// this is here because guilded webhook migration is a thing
				try {
					await this[platform].bridgeSend(msg, id);
				} catch (e) {
					await this[platform].bridgeSend(
						boltError(
							"legacy bridge send",
							"send to other platform",
							process.env.prod,
							e
						),
						id
					);
				}
			} else {
				try {
					await this[platform].idSend(msg, id);
				} catch (e) {
					await this[platform].idSend(
						boltError(
							"legacy bridge send",
							"send to other platform - guilded webhookless",
							process.env.prod,
							e
						),
						id
					);
				}
			}
		}
	}

	// TODO: this is a mess, clean it up
	async commandhandle(msg, bridgeIdentifierLegacy) {
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
							await this.legacyBridgeDatabase.put(
								`${msg.platform}-${msg.channel}`,
								arg.commands[2]
							);
							if (msg.platform == "discord") {
								let webhook = await msg[
									"platform.message"
								].channel.createWebhook("bridge");
								await this.legacyBridgeDatabase.put(
									`${msg.platform}-${arg.commands[2]}`,
									{
										id: webhook.id,
										token: webhook.token,
									}
								);
							}
							if (msg.platform == "guilded") {
								let { webhook } =
									await this.guilded.guilded.rest.router.createWebhook(
										msg.guild,
										{
											name: "bridge",
											channelId: msg.channel,
										}
									);
								await this.legacyBridgeDatabase.put(
									`${msg.platform}-${arg.commands[2]}`,
									{
										id: webhook.id,
										token: webhook.token,
									}
								);
							}
							if (msg.platform == "revolt") {
								await this.legacyBridgeDatabase.put(
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
							await this.legacyBridgeDatabase.delete(
								`${msg.platform}-${bridgeIdentifierLegacy}`
							);
							await this.legacyBridgeDatabase.delete(
								`${msg.platform}-${msg.channel}`
							);
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

	async isbridged(msg) {
		if (msg.platform === "guilded") {
			return (
				(msg.author.id === this.guilded.guilded.user.id && msg.embeds) ||
				(msg["platform.message"].createdByWebhookId &&
					(await this.bridgedatabase.find({
						"bridges.platform": "guilded",
						"bridges.senddata.id": msg["platform.message"].createdByWebhookId,
					}))) ||
				(await this.legacyBridgeDatabase.find({
					id: msg["platform.message"].createdByWebhookId,
				}))
			);
		} else if (msg.platform === "discord") {
			return (
				msg["platform.message"].webhookId &&
				((await this.legacyBridgeDatabase.find({
					id: msg["platform.message"].webhookId,
				})) ||
					(await this.bridgedatabase.find({
						"bridges.platform": "discord",
						"bridges.senddata.id": msg["platform.message"].webhookId,
					})))
			);
		} else if (msg.platform === "revolt") {
			return (
				msg.author.id == this.revolt.revolt.user?._id &&
				msg["platform.message"].masquerade
			);
		}
	}

	async bridgeSend(msg, thisbridge) {
		let bridges = thisbridge.bridges.filter((i) => {
			return !(i.platform == msg.platform && i.channel == msg.channel);
		});
		let sentmsgs = [];
		for (let i in bridges) {
			let bridge = bridges[i];
			sentmsgs.push(
				await (async () => {
					try {
						return await this[bridge.platform].bridgeSend(msg, bridge.senddata);
					} catch (e) {
						return await this[bridge.platform].bridgeSend(
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
		this.bridgedatabase.put(`message-${msg.id}`, {
			message: {
				platform: msg.platform,
				channel: msg.channel,
				message: msg.id,
			},
			sent_to: sentmsgs,
		});
	}
}
