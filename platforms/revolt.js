import { Client as RevoltClient } from "revolt.js";
import EventEmitter from "events";

class revoltClient extends EventEmitter {
	constructor(config) {
		super();
		this.config = config;
		this.revolt = new RevoltClient();
		this.revolt.on("ready", () => {
			this.emit("ready");
		});
		this.revolt.on("message", async (message) => {
			if (message.system) return;
			let bg = (await message.author.fetchProfile()).background;
			let msg = {
				content: message.content,
				author: {
					username: message.member.nickname || message.author.username,
					profile: message.author.generateAvatarURL(),
					banner: null,
					id: message.author_id,
				},
				replyto:
					message.reply_ids?.length > 0 ? await this.getReply(message) : null,
				attachments: await this.getAttachments(message),
				platform: "revolt",
				channel: message.channel_id,
				guild: message.channel.server_id,
				id: message._id,
				"platform.message": message,
				reply: (content) => {
					message.reply(content);
				},
				embeds: message.embeds,
			};
			if (bg)
				msg.author.banner = `https://autumn.revolt.chat/backgrounds/${
					bg._id
				}/${encodeURI(bg.filename)}`;
			this.emit("msg", msg);
		});
		this.revolt.loginBot(this.config.token);
	}
	async getReply(message) {
		let msg = this.revolt.messages.$get(message.reply_ids[0]);
		if (!msg) return null;
		return {
			content: msg.content,
			author: {
				username: message.member.nickname || message.author.username,
				profile: message.author.generateAvatarURL(),
			},
			embeds: await this.getEmbeds(msg),
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
	async bridgeSend(msg, id) {
		if (!id) return;
		let message = {
			masquerade: {
				name: msg.author.username,
				avatar: msg.author.profile,
			},
			content: msg.content,
		};
		if (msg.attachments?.length > 0) {
			message.attachments = [];
			for (let attachment in msg.attachments) {
				let formdat = new FormData();
				formdat.append(
					"file",
					await fetch(msg.attachments[attachment].file).then((res) =>
						res.blob()
					)
				);
				message.attachments.push(
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
			message.embeds = [
				{
					title: `Replying to ${msg.replyto.author.username}'s message`,
					icon_url: msg.replyto.author.profile,
					description: msg.replyto.content,
				},
			];
		}
		message.embeds.push(...msg.embeds)
		await this.revolt.channels.$get(id).sendMessage(message);
	}
}

export default revoltClient;
