import { Client as GuildedClient } from "guilded.js";
import { parseMessage } from "@guildedjs/webhook-client";
import EventEmitter from "events";

class guildedClient extends EventEmitter {
	constructor(config) {
		super();
		this.config = config;
		this.guilded = new GuildedClient({ token: this.config.token });
		this.guilded.on("ready", () => {
			this.emit("ready");
		});
		this.guilded.on("messageCreated", async (message) => {
			if (message.type === 1) return;
			if (!message.createdByWebhookId) {
				await this.guilded.members.fetch(message.serverId, message.authorId);
			}
			let msg = {
				content: message.content.replace("![]", "[]"),
				author: {
					username: message.member?.displayName || message.author?.name,
					profile: message.author?.avatar,
					banner: message.author?.banner,
					id: message.authorId,
				},
				replyto:
					message.replyMessageIds.length > 0
						? await this.getReply(message)
						: null,
				attachments: [], // guilded attachments suck and don't have a bot api impl
				platform: "guilded",
				channel: message.channelId,
				guild: message.serverId,
				id: message.id,
				"platform.message": message,
				reply: (content) => {
					return message.reply(content);
				},
				embeds: message.raw.embeds,
			};
			this.emit("msg", msg);
		});
		this.guilded.login();
	}
	async getReply(message) {
		let msg2 = await this.guilded.messages.fetch(
			message.channelId,
			message.replyMessageIds[0]
		);
		await this.guilded.members.fetch(msg2.serverId, msg2.authorId);
		return {
			content: msg2.content.replace("![]", "[]"),
			author: {
				username: msg2.author.name,
				profile: msg2.author.avatar,
			},
			embeds: msg2.raw.embeds,
		};
	}
	async idSend(msg, id) {
		let channel = await this.guilded.channels.fetch(id);
		let senddat = {
			embeds: [
				{
					author: {
						name: msg.author.username,
						icon_url: msg.author.profile,
					},
					description: msg.content,
					footer: {
						text: "try setting up this bridge again for webhooks"
					}
				},
				...(msg.embeds || []),
			],
		};
		if (msg.replyto) {
			senddat.embeds[0].description += `\n**In response to ${msg.replyto.author.username}'s message:**\n${msg.replyto.content}`;
		}
		if (msg.attachments?.length > 0) {
			senddat.embeds[0].description += `\n**Attachments:**\n${msg.attachments
				.map((a) => {
					return `![${a.alt || a.name}](${a.file})`;
				})
				.join("\n")}`;
		}
		await channel.send(senddat);
	}
	async bridgeSend(msg, hookdat) {
		let dat = {
			content: msg.content,
			username: msg.author.username,
			avatar_url: msg.author.profile,
		};
		if (!msg.replyto) {
			await this._webhooksend(hookdat, dat);
		} else {
			await this._webhooksend(hookdat, {
				...dat,
				embeds: [
					{
						author: {
							name: `reply to ${msg.replyto.author.username}`,
							icon_url: msg.replyto.author.profile,
						},
						description: msg.replyto.content,
					},
					...(msg.replyto.embeds || []),
				],
			});
		}
	}
	async _webhooksend(hookdat, message) {
		// i'd much rather use the guilded.js webhook client but it doesn't work how i want it to
		let data = await (
			await fetch(
				`https://media.guilded.gg/webhooks/${hookdat.id}/${hookdat.token}`,
				{
					method: "POST",
					body: JSON.stringify(message),
					headers: {
						"Content-Type": "application/json",
					},
				}
			)
		).json();
	}
}

export default guildedClient;
