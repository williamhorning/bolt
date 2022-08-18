import {
	Client as DiscordClient,
	Intents as DiscordIntents,
	WebhookClient,
} from "discord.js";
import EventEmitter from "events";
import parse from "./argv.js";

class discordClient extends EventEmitter {
	constructor(token) {
		super();
		this.discord = new DiscordClient({
			intents: Object.values(DiscordIntents.FLAGS),
		});
		this.discord.on("ready", () => {
			this.emit("ready");
		});
		this.discord.on("messageCreate", async (message) => {
			try {
				let thisBridge = await db.get(
					"bridgev1",
					`discord-${message.channelId}`
				);
				if (
					message.webhookId &&
					(await db.find("bridgev1", { "value.id": message.webhookId }))
				) {
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
										throw new Error("You already have a bridge set up.");
									} else if (arg.commands[2] == message.channelId) {
                    throw new Error("Due to a database bug, you can't name a bridge the channel ID.")
                  }
									let webhook = await message.channel.createWebhook("bridge");
									await db.upsert(`bridgev1`, `discord-${arg.commands[2]}`, {
										id: webhook.id,
										token: webhook.token,
									});
									await db.upsert(
										`bridgev1`,
										`discord-${message.channelId}`,
										arg.commands[2]
									);
									await message.reply("Bridge created, hopefully it works");
								} catch (e) {
									throw new Error(`Failed to join bridge: ${e.message || e}.`);
								}
							} else if (arg.commands[1] === "leave") {
								try {
									if (!thisBridge) throw new Error("No bridge found");
									let hookdat = await db.get(
										"bridgev1",
										`discord-${thisBridge}`
									);
									let hook = new WebhookClient(hookdat);
									await hook.delete();
									await db.delete(`bridgev1`, `discord-${thisBridge}`);
									await db.delete(`bridgev1`, `discord-${message.channelId}`);
									await message.reply("Bridge deleted");
								} catch (e) {
									throw new Error(`Failed to leave bridge: ${e.message || e}.`);
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
						throw new Error("Unknown command, try `!bolt help`.");
					}
				} else if (message.content.startsWith("!bridge")) {
					throw new Error("Please use the `!bolt bridge legacy` command.");
				}
				if (thisBridge) {
					let crossPlatformMessage = {
						content: message.cleanContent,
						author: {
							username: message.author.username,
							profile: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.webp?size=80`,
						},
						attachments: [],
						replyto: null,
					};
					if (message.reference) {
						let msg2 = await message.fetchReference();
						crossPlatformMessage.replyto = {
							content: `${msg2.cleanContent.substring(0, 12)}...`,
							author: {
								username: msg2.author.username,
								profile: `https://cdn.discordapp.com/avatars/${msg2.author.id}/${msg2.author.avatar}.webp?size=80`,
							},
						};
					}
					if (message.attachments) {
						message.attachments.forEach(
							({ proxyURL, description, spoiler, name }) => {
								crossPlatformMessage.attachments.push({
									file: proxyURL,
									alt: description,
									spoiler,
									name,
								});
							}
						);
					}
					this.emit("message", thisBridge, crossPlatformMessage);
				}
			} catch (e) {
				await message.reply(
					`something went wrong: ${
						e.message || e
					} if this keeps happening, join william's server, linked on https://williamhorning.dev\n\`\`\`${
						e.stack
					}\`\`\``
				);
			}
		});
		this.discord.login(token);
	}
	async legacyBridgeSend(bridge, crossPlatformMessage) {
		let hookdat = await db.get("bridgev1", `discord-${bridge}`);
		if (hookdat) {
			try {
				let hook = new WebhookClient(hookdat);
				let dscattachments = crossPlatformMessage.attachments.map(
					(crossplat) => {
						return {
							attachment: crossplat.file,
							description: crossplat.alt,
							name: crossplat.name,
						};
					}
				);
				let dat = {
					content: `${crossPlatformMessage.content}`,
					username: crossPlatformMessage.author.username,
					avatarURL: crossPlatformMessage.author.profile,
					files: dscattachments,
				};
				if (!crossPlatformMessage.replyto) {
					await hook.send(dat);
				} else {
					await hook.send({
						...dat,
						embeds: [
							{
								author: {
									name: crossPlatformMessage.replyto.author.username,
									icon_url: crossPlatformMessage.replyto.author.profile,
								},
								title: "In reply to",
								description: crossPlatformMessage.replyto.content,
							},
						],
					});
				}
			} catch (e) {
				let hook = new WebhookClient(hookdat);
				await hook.send(
					`something went wrong when trying to send a message here: ${
						e.message || e
					} if this keeps happening, join william's server, linked on https://williamhorning.dev\n\`\`\`${
						e.stack
					}\`\`\``
				);
			}
		}
	}
}

export default discordClient;
