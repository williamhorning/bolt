import {
	Client as DiscordClient,
	Intents as DiscordIntents,
	WebhookClient,
} from "discord.js";
import EventEmitter from "node:events";
import { commandhandle } from "../commands/index.js";

export default class dscd extends EventEmitter {
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
		this.discord.on("interactionCreate", async (interaction) => {
			if (!interaction.isCommand()) return;
			await interaction.deferReply();
			let opts = {};
			for (let item of interaction.options?.data[0]?.options || []) {
				opts[item.name] = item.value;
			}
			commandhandle({
				cmd: interaction.commandName,
				subcmd: interaction.options.getSubcommand(false),
				channel: interaction.channelId,
				platform: "discord",
				guild: interaction.guildId,
				opts,
				replyfn: async (msg) => {
					await interaction.editReply(this.constructDiscordMessage(msg));
				},
				timestamp: interaction.createdTimestamp,
			});
		});
		this.discord.login(this.config.token);
	}
	async constructmsg(message) {
		return {
			content: message.flags.has("LOADING")
				? "loading..."
				: message.cleanContent?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
			author: {
				username:
					message.member?.nickname ||
					message.member?.displayName ||
					message.author.username,
				rawname: message.author.username,
				profile: message.author.displayAvatarURL(),
				id: message.author.id,
			},
			replyto: message.reference ? await this.getReply(message) : undefined,
			attachments: await this.getAttachments(message),
			platform: "discord",
			channel: message.channelId,
			guild: message.guildId,
			id: message.id,
			"platform.message": message,
			timestamp: message.createdTimestamp,
			reply: (content) => {
				if (typeof content != "string")
					content = this.constructDiscordMessage(content);
				return message.reply(content);
			},
			embeds: message.embeds?.map((i) => {
				i = i.toJSON();
				if (i.fields) {
					for (let field of i.fields || []) {
						field.name = field.name || "*";
					}
				}
				return Object.fromEntries(
					Object.entries(i).filter(([_, v]) => v != null)
				);
			}),
			webhookid: message.webhookId,
		};
	}
	async getReply(message) {
		if (!(message?.reference?.guildId === message?.guildId)) return;
		try {
			let msg = await message.fetchReference();
			if (!msg) return;
			return {
				content: msg.cleanContent,
				author: {
					username: msg.member?.displayName || msg.author.username,
					profile: `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.webp?size=80`,
				},
				embeds: msg.embeds,
			};
		} catch {
			return;
		}
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
	constructDiscordMessage(msgd) {
		let msg = Object.assign({}, msgd);
		let content = msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)");
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
			embeds: [...(msg.embeds || [])],
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
		// if dat.content and dat.embeds is just an empty array, set content to empty message
		if (dat.content == "" && dat.embeds?.length == 0)
			dat.content = "*empty message*";
		return dat;
	}

	async bridgeSend(msg, hookdat) {
		let hook = new WebhookClient(hookdat);
		let { id: message, channel_id: channel } = await hook.send(
			this.constructDiscordMessage(msg)
		);
		return { platform: "discord", message, channel };
	}
	async createSenddata(channelid) {
		{
			const channel = await this.discord.channels.fetch(channelid);
			if (channel.type !== "GUILD_TEXT") {
				throw new Error("Can't create a bridge here");
			}
			const a = await channel.createWebhook("bridge");
			return {
				id: a.id,
				token: a.token,
			};
		}
	}
}
