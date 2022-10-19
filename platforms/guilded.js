import { Client as GuildedClient, WebhookClient } from "guilded.js";
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
			this.emit("msgcreate", await this.constructmsg(message));
		});
		this.guilded.on("messageUpdated", async (oldmessage, newmessage) => {
			if (oldmessage.type === 1) return;
			this.emit("msgedit", await this.constructmsg(newmessage));
		});
		this.guilded.on("messageDeleted", async (message) => {
			if (message.type === 1) return;
			this.emit("msgdelete", await this.constructmsg(message));
		});
		this.guilded.login();
	}
	async constructmsg(message) {
		if (!message.createdByWebhookId) {
			await this.guilded.members.fetch(message.serverId, message.authorId);
		}
		return {
			content: message.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
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
	}
	async getReply(message) {
		let msg2 = await this.guilded.messages.fetch(
			message.channelId,
			message.replyMessageIds[0]
		);
		await this.guilded.members.fetch(msg2.serverId, msg2.authorId);
		return {
			content: msg2.content,
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
						// TODO: i should probably localize this, but i cant speak other languages
						text: "try setting up this bridge again for webhooks",
					},
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
			content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
			username: msg.author.username,
			avatar_url: msg.author.profile,
			embeds: msg.embeds,
		};
		dat.content += `${dat.content ? "\n" : ""}${msg.attachments
			?.map((a) => {
				return `![${a.alt || a.name}](${a.file})`;
			})
			?.join("\n")}`;
		if (msg.replyto) {
			dat.embeds.push(
				...[
					{
						author: {
							name: `reply to ${msg.replyto.author.username}`,
							icon_url: msg.replyto.author.profile,
						},
						description: msg.replyto.content,
					},
					...(msg.replyto.embeds || []),
				]
			);
		}
		if (msg?.embeds?.length < 1) delete dat.embeds;
		let hook = new WebhookClient(hookdat);
		let { id: message, channelId: channel } = await hook.send(dat);
		return { platform: "guilded", message, channel };
	}
}

export default guildedClient;
