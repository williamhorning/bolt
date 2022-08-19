import { Client as GuildedClient, WebhookClient } from "guilded.js";
import EventEmitter from "events";
import parse from "./argv.js";

class guildedClient extends EventEmitter {
	constructor(token) {
		super();
		this.guilded = new GuildedClient({ token });
		this.guilded.on("ready", () => {
			this.emit("ready");
		});
		this.guilded.on("messageCreated", async (message) => {
			try {
				let thisBridge = await db.get(
					"bridgev1",
					`guilded-${message.channelId}`
				);
				if (message.authorId === this.guilded.user.id) {
					return; // dont create a ddos machine
				}
				if (message.content.startsWith("!bolt")) {
					let arg = parse(message.content);
					let cmd = arg.commands.shift();
					if (cmd === "bridge") {
						if (arg.commands[0] === "legacy") {
							if (arg.commands[1] === "join") {
								if (!arg.commands[2]) {
									throw new Error("Please specify a bridge ID.");
								}
								try {
									if (thisBridge) {
										throw new Error(
											"You already have a bridge set up."
										);
									} else if (arg.commands[2] == message.channelId) {
                    throw new Error("Due to a database bug, you can't name a bridge the channel ID.")
                  }
									await db.upsert(
										`bridgev1`,
										`guilded-${arg.commands[2]}`,
										message.channelId
									);
									await db.upsert(
										`bridgev1`,
										`guilded-${message.channelId}`,
										arg.commands[2]
									);
									await message.reply("Bridge created, hopfully it works");
								} catch (e) {
									throw new Error(`Failed to join bridge: ${e.message || e}.`);
								}
							} else if (arg.commands[1] === "leave") {
								try {
									if (!thisBridge) throw new Error("No bridge found");
									await db.delete(`bridgev1`, `guilded-${thisBridge}`);
									await db.delete(`bridgev1`, `guilded-${message.channelId}`);
									await message.reply("Bridge deleted");
								} catch (e) {
									throw new Error(`Failed to delete bridge: ${e.message}.`);
								}
							} else if (arg.commands[1] === "help") {
								await message.reply(
									"Bridge commands:\n!bolt bridge legacy join <bridgeID>\n!bolt bridge legacy leave"
								);
							} else {
								throw new Error(
									"Unknown command, try `!bolt bridge legacy help`."
								);
							}
						} else if (arg.commands[0] === "help") {
							await message.reply(
								"bridge help: \n!bolt bridge legacy - bridge using the legacy system, not recommended"
							);
						} else {
							throw new Error("Unknown command, try `!bolt bridge help`.");
						}
					} else if (cmd === "help") {
						await message.reply(
							"help: \n!bolt bridge legacy - bridge using the legacy system, not recommended"
						);
					} else {
						throw new Error("Unknown command, try `!bolt help`");
					}
				} else if (message.content.startsWith("!bridge")) {
					throw new Error("Please use !bolt instead of !bridge");
				}
				if (thisBridge) {
					await this.guilded.members.fetch(message.serverId, message.authorId);
					let crossPlatformMessage = {
						content: message.content,
						author: {
							username: message.member.displayName || message.author.name,
							profile: message.author.avatar,
						},
						attachments: [],
						replyto: null,
					};
					if (message.replyMessageIds.length > 0) {
						console.log(message.replyMessageIds[0]);
						let msg2 = await this.guilded.messages.fetch(
							message.channelId,
							message.replyMessageIds[0]
						);
						await this.guilded.members.fetch(msg2.serverId, msg2.authorId);
						crossPlatformMessage.replyto = {
							content: `${msg2.content.substring(0, 12)}...`,
							author: {
								username: msg2.author.name,
								profile: msg2.author.avatar,
							},
						};
					}
					this.emit("message", thisBridge, crossPlatformMessage);
				}
			} catch (e) {
				await message.reply(
					`something went wrong: ${
						e.message || e
					} if this keeps happening, join william's server, linked on https://williamhorning.dev\nstack trace will be in the console`
				);
				console.log(e.stack);
			}
		});
		this.guilded.login();
	}

	async legacyBridgeSend(bridge, crossPlatformMessage) {
		let dat = await db.get("bridgev1", `guilded-${bridge}`);
		if (dat) {
			try {
				let channel = await this.guilded.channels.fetch(dat);
				let senddat = {
					embeds: [
						{
							author: {
								name: crossPlatformMessage.author.username,
								icon_url: crossPlatformMessage.author.profile,
							},
							description: crossPlatformMessage.content,
						},
					],
				};
				if (crossPlatformMessage.replyto) {
					senddat.embeds[0].description += `\n\n**In response to:**\n${crossPlatformMessage.replyto.content}\n\n**By:**\n${crossPlatformMessage.replyto.author.username}`;
				}
				await channel.send(senddat);
				if (crossPlatformMessage.attachments.length > 0) {
					await channel.send(
						crossPlatformMessage.attachments.map((a) => a.file).join("\n")
					);
				}
			} catch (e) {
				let channel = await this.guilded.channels.fetch(dat);
				await channel.send(
					`something went wrong when trying to send a message here: ${
						e.message || e
					} if this keeps happening, join william's server, linked on https://williamhorning.dev\nstack trace will be in the console`
				);
				console.log(e.stack);
			}
		}
	}
}

export default guildedClient;
