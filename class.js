import { argvParse, boltError, mongoWrapper } from "./utils.js";
import discordClient from "./platforms/discord.js";
import guildedClient from "./platforms/guilded.js";
import revoltClient from "./platforms/revolt.js";

export class client {
	constructor() {
		this.db = new mongoWrapper({ prod: process.env.prod });

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
	}
	async setup() {
		await this.db.setup();

		this.discord.on("msg", this.msgHandle.bind(this));
		this.guilded.on("msg", this.msgHandle.bind(this));
		this.revolt.on("msg", this.msgHandle.bind(this));
	}
	async msgHandle(msg) {
		try {
			if (
				msg.platform === "guilded" &&
				msg.author.id === this.guilded.guilded.user.id &&
				msg.embeds
			)
				return;
			if (
				msg.platform === "discord" &&
				msg["platform.message"].webhookId &&
				(await this.db.find("bridgev1", {
					"value.id": msg["platform.message"].webhookId,
				}))
			)
				return;
			if (
				msg.platform === "revolt" &&
				msg.author.id == this.revolt.revolt.user?._id &&
				msg["platform.message"].masquerade
			)
				return;
		} catch (e) {
			msg.reply(
				boltError(
					"msg event",
					"returning on bridge msg",
					process.env.prod,
					e,
					msg.platform === "guilded" ? true : false
				)
			);
			return;
		}
		let bridgeIdentifierLegacy = await this.db.get(
			"bridgev1",
			`${msg.platform}-${msg.channel}`
		);
		if (msg.content.startsWith("!bolt")) {
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
								await this.db.put(
									`bridgev1`,
									`${msg.platform}-${msg.channel}`,
									arg.commands[2]
								);
								if (!msg.platform == "discord") {
									await this.db.put(
										`bridgev1`,
										`${msg.platform}-${arg.commands[2]}`,
										msg.channel
									);
								} else {
									let webhook = await msg[
										"platform.message"
									].channel.createWebhook("bridge");
									await this.db.put(
										`bridgev1`,
										`${msg.platform}-${arg.commands[2]}`,
										{
											id: webhook.id,
											token: webhook.token,
										}
									);
								}
								await msg.reply("Bridge created, hopfully it works");
							} catch (e) {
								throw new Error(`Failed to join bridge: ${e.message || e}.`);
							}
						} else if (arg.commands[1] === "leave") {
							try {
								if (!bridgeIdentifierLegacy) throw new Error("No bridge found");
								await this.db.delete(
									`bridgev1`,
									`${msg.platform}-${bridgeIdentifierLegacy}`
								);
								await this.db.delete(
									`bridgev1`,
									`${msg.platform}-${msg.channel}`
								);
								await msg.reply("Bridge deleted");
							} catch (e) {
								throw new Error(`Failed to delete bridge: ${e.message}.`);
							}
						} else if (arg.commands[1] === "help") {
							await msg.reply(
								"Bridge commands:\n!bolt bridge legacy join <bridgeID>\n!bolt bridge legacy leave\nLegal:\https://github.com/williamhorning/bolt/blob/main/legalese.md"
							);
						} else {
							throw new Error(
								"Unknown command, try `!bolt bridge legacy help`."
							);
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
						"help: \n!bolt bridge legacy - bridge using the legacy system, not recommended"
					);
				} else {
					throw new Error("Unknown command, try `!bolt help`");
				}
			} catch (e) {
				await msg.reply(boltError("command handler", "unified", process.env.prod, e));
			}
		}
		if (bridgeIdentifierLegacy) {
			let platforms = ["discord", "guilded", "revolt"];
			platforms.splice(platforms.indexOf(msg.platform), 1);
			msg.author.username = `<${msg.platform}> ${msg.author.username}`;
			for (let platform of platforms) {
				let id = await this.db.get(
					"bridgev1",
					`${platform}-${bridgeIdentifierLegacy}`
				);
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
			}
		}
	}
}
