import EventEmitter from "events";
import { Client as RevoltClient } from "revolt.js";

class revoltClient extends EventEmitter {
	constructor(config) {
		super();
		this.config = config;
		this.revolt = new RevoltClient();
		this.revolt.on("ready", () => {
			console.log("rvlt");
			this.emit("ready");
		});
		this.revolt.on("message", async (message) => {
			console.log(message);
			if (!message || message.system) return;
			this.emit("msgcreate", await this.constructmsg(message));
		});
		this.revolt.on("message/update", async (message) => {
			if (!message || message.system) return;
			this.emit("msgedit", await this.constructmsg(message));
		});
		this.revolt.on("message/delete", async (id, message) => {
			if (!message || message.system) return;
			this.emit("msgdelete", await this.constructmsg(message));
		});
		this.revolt.loginBot(this.config.token);
	}
	async constructmsg(message) {
		let bg = (await message.author.fetchProfile()).background;
		let msg = {
			content: message.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
			author: {
				username: message.member?.nickname || message.author.username,
				rawname: message.author.username,
				profile: message.author.generateAvatarURL(),
				banner: null,
				id: message.author_id,
			},
			replyto:
				message.reply_ids?.length > 0
					? await this.getReply(message)
					: undefined,
			attachments: await this.getAttachments(message),
			platform: "revolt",
			channel: message.channel_id,
			guild: message.channel.server_id,
			id: message._id,
			"platform.message": message,
			timestamp: message.createdAt,
			reply: async (content) => {
				if (typeof content != "string")
					content = await this.constructRevoltMessage(content);
				message.reply(content);
			},
			embeds: message.embeds?.filter((embed) => {
				if (embed.type !== "Image") return true;
			}),
			boltCommand: {},
		};
		if (bg)
			msg.author.banner = `https://autumn.revolt.chat/backgrounds/${
				bg._id
			}/${encodeURI(bg.filename)}`;
		return msg;
	}
	async getReply(message) {
		let msg = this.revolt.messages.$get(message.reply_ids[0]);
		if (!msg) return null;
		return {
			content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
			author: {
				username: message.member.nickname || message.author.username,
				profile: message.author.generateAvatarURL(),
			},
			embeds: msg.embeds,
		};
	}
	async getAttachments(message) {
		return (
			message.attachments?.map((attachment) => {
				return {
					file: `https://autumn.revolt.chat/attachments/${
						attachment._id
					}/${encodeURI(attachment.filename)}`,
					alt: attachment.filename,
					spoiler: false,
					name: attachment.filename,
				};
			}) || []
		);
	}
	async constructRevoltMessage(msgd) {
		let msg = Object.assign({}, msgd);
		let dat = {
			content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
		};
		if (!msgd.bolterror) {
			dat.masquerade = {
				name: msg.author.username,
				avatar: msg.author.profile,
			};
		}
		if (msg.attachments?.length > 0) {
			dat.attachments = [];
			for (let attachment in msg.attachments) {
				let formdat = new FormData();
				formdat.append(
					"file",
					await fetch(msg.attachments[attachment].file).then((res) =>
						res.blob()
					)
				);
				dat.attachments.push(
					(
						await (
							await fetch(`https://autumn.revolt.chat/attachments`, {
								method: "POST",
								body: formdat,
							})
						).json()
					).id
				);
			}
		}
		if (msg.replyto) {
			dat.embeds = [
				{
					title: `Replying to ${msg.replyto.author.username}'s message`,
					icon_url: msg.replyto.author.profile,
					description: msg.replyto.content,
				},
			];
		}
		if (msg.embeds?.length > 0) {
			dat.embeds = [
				...msg.embeds?.map((i) => {
					if (i.fields) {
						for (let field of i.fields) {
							i.description += `\n**${field.name}**\n${field.value}\n`;
						}
						delete i.fields;
					}
					return i;
				}),
				...(dat.embeds || []),
			];
		} else if (msg.content == "" || !msg.content) {
			dat.content = "*empty message*";
		}
		return dat;
	}
	async bridgeSend(msg, id) {
		if (!id) return;
		let rvlchannel;
		try {
			rvlchannel = await this.revolt.channels.fetch(id?.id || id);
		} catch {
			return;
		}
		let { _id: message, channel_id: channel } = await rvlchannel.sendMessage(
			await this.constructRevoltMessage(msg)
		);
		return { platform: "revolt", message, channel };
	}
}

export default revoltClient;
