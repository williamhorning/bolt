import {
	Client as DiscordClient,
	Intents as DiscordIntents,
	WebhookClient,
} from "discord.js";
import EventEmitter from "events";

class discordClient extends EventEmitter {
	constructor(config) {
		super();
		this.config = config;
		this.discord = new DiscordClient({
			intents: Object.values(DiscordIntents.FLAGS),
		});
		this.discord.on("ready", () => {
			this.emit("ready");
		});
		this.discord.on("messageCreate", async (message) => {
			if (message.system) return;
			this.emit("msgcreate", await this.constructmsg(message));
		});
		this.discord.on("messageUpdate", async (oldMessage, newMessage) => {
			if (oldMessage.system) return;
			this.emit("msgedit", await this.constructmsg(newMessage));
		});
		this.discord.on("messageDelete", async (deletedMessage) => {
			if (deletedMessage.system) return;
			this.emit("msgdelete", await this.constructmsg(deletedMessage));
		});
		this.discord.login(this.config.token);
	}
	async constructmsg(message) {
		return {
			content: message.cleanContent?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
			author: {
				username: message.member?.displayName || message.author.username,
        rawname: message.author.username,
				profile: message.author.displayAvatarURL(),
				// todo: reimplement banner, this solution breaks if we don't fetch user, but that breaks if the user isnt a user, and is a webhook
				// banner: message.author.bannerURL(),
				id: message.author.id,
			},
			replyto: message.reference ? await this.getReply(message) : null,
			attachments: await this.getAttachments(message),
			platform: "discord",
			channel: message.channelId,
			guild: message.guildId,
			id: message.id,
			"platform.message": message,
      timestamp: message.createdTimestamp,
			reply: (content) => {
        if (typeof content != "string") content = this.constructDiscordMessage(content)
				return message.reply(content);
			},
			embeds: message.embeds?.map((i) => {
        i=i.toJSON()
        return Object.fromEntries(Object.entries(i).filter(([_, v]) => v != null))
      }),
		};
	}
	async getReply(message) {
		let msg = await message.fetchReference();
		return {
			content: msg.cleanContent,
			author: {
				username: msg.member?.displayName || msg.author.username,
				profile: `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.webp?size=80`,
			},
			embeds: msg.embeds,
		};
	}
	async getAttachments(message) {
		if (message.attachments.length < 0) return null;
		return message.attachments.map(
			({ proxyURL, description, spoiler, name }) => {
				return {
					file: proxyURL,
					alt: description,
					spoiler,
					name,
				};
			}
		);
	}
	constructDiscordMessage(msg) {
		let content = msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)")
		if (content?.length == 0) content = null;
		let dscattachments = msg.attachments?.map((crossplat) => {
			return {
				attachment: crossplat.file,
				description: crossplat.alt,
				name: crossplat.name,
			};
		});
		let dat = {
			content,
			username: msg.author.username,
			avatarURL: msg.author.profile,
			files: dscattachments,
			embeds: msg.embeds || [],
		};
		if (msg.replyto) {
			dat.embeds.push({
				author: {
					name: `reply to ${msg.replyto.author.username}`,
					icon_url: msg.replyto.author.profile,
				},
				description: `${msg.replyto.content} ` || "*empty message*",
			});
			dat.embeds.push(...(msg.replyto.embeds || []));
		}
		return dat;
	}
	async bridgeSend(msg, hookdat) {
		let hook = new WebhookClient(hookdat);
		let { id: message, channel_id: channel } = await hook.send(
			this.constructDiscordMessage(msg)
		);
		return { platform: "discord", message, channel };
	}
	async bridgeEdit(id, msg, hookdat) {
		let hook = new WebhookClient(hookdat);
		await hook.editMessage(id, this.constructDiscordMessage(msg));
	}
	async bridgeDelete(id, hookdat) {
		let hook = new WebhookClient(hookdat);
		await hook.deleteMessage(id);
	}
}

export default discordClient;
