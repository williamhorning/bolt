import {
	APIEmbed,
	APIWebhookMessagePayloadResolvable,
	BoltEmbed,
	BoltMessage,
	Message
} from './deps.ts';
import GuildedPlugin from './mod.ts';

export async function messageToCore(
	message: Message,
	plugin: GuildedPlugin,
	replybool = true
): Promise<BoltMessage<Message> | undefined> {
	if (!message.serverId) return;
	const author = await plugin.bot.members.fetch(
		message.serverId,
		message.authorId
	);
	return {
		author: {
			username: author.nickname || author.username || 'user on guilded',
			rawname: author.username || 'user on guilded',
			profile: author.user?.avatar || undefined,
			id: message.authorId,
			color: '#F5C400'
		},
		channel: message.channelId,
		id: message.id,
		timestamp: message.createdAt.getTime(),
		embeds: message.embeds?.map(embed => {
			return {
				...embed,
				author: embed.author
					? {
							name: embed.author.name || 'embed author',
							iconUrl: embed.author.iconURL || undefined,
							url: embed.author.url || undefined
					  }
					: undefined,
				image: embed.image || undefined,
				thumbnail: embed.thumbnail || undefined,
				timestamp: embed.timestamp ? Number(embed.timestamp) : undefined,
				color: embed.color || undefined,
				description: embed.description || undefined,
				fields: embed.fields.map(i => {
					return {
						...i,
						inline: i.inline || undefined
					};
				}),
				footer: embed.footer || undefined,
				title: embed.title || undefined,
				url: embed.url || undefined,
				video: embed.video || undefined
			};
		}),
		platform: {
			name: 'bolt-guilded',
			message,
			webhookid: message.createdByWebhookId
		},
		reply: async (msg: BoltMessage<unknown>) => {
			await message.reply(coreToMessage(msg));
		},
		content: message.content,
		guild: message.serverId,
		replyto: (await replyto(message, plugin, replybool)) || undefined
	};
}

async function replyto(
	message: Message,
	plugin: GuildedPlugin,
	replybool: boolean
) {
	if (message.isReply && replybool) {
		try {
			return await messageToCore(
				await plugin.bot.messages.fetch(
					message.channelId,
					message.replyMessageIds[0]
				),
				plugin,
				false
			);
		} catch {
			return;
		}
	} else {
		return;
	}
}

function chooseValidGuildedUsername(msg: BoltMessage<unknown>) {
	if (validUsernameCheck(msg.author.username)) {
		return msg.author.username;
	} else if (validUsernameCheck(msg.author.rawname)) {
		return msg.author.rawname;
	} else {
		return `${msg.author.id}`;
	}
}

function validUsernameCheck(e: string) {
	if (!e || e.length === 0) return false;
	if (
		e.startsWith(' ') ||
		e.endsWith(' ') ||
		e.startsWith(' ') ||
		e.endsWith(' ')
	)
		return false;
	if (e.length > 32) return false;
	return Boolean(e.match(/^[a-zA-Z0-9_ ()]*$/gms));
}

export function coreToMessage(
	msg: BoltMessage<unknown>
): APIWebhookMessagePayloadResolvable {
	const message = {
		content: msg.content,
		avatar_url: msg.author.profile,
		username: chooseValidGuildedUsername(msg),
		embeds: msg.embeds?.map(embed => {
			Object.keys(embed).forEach(key => {
				embed[key as keyof BoltEmbed] === null
					? (embed[key as keyof BoltEmbed] = undefined)
					: embed[key as keyof BoltEmbed];
			});
			return {
				...embed,
				author: {
					...embed.author,
					icon_url: embed.author?.iconUrl
				},
				timestamp: embed.timestamp ? new Date(embed.timestamp) : undefined
			};
		}) as APIEmbed[] | undefined
	};
	if (msg.replyto) {
		if (!message.embeds) message.embeds = [];
		message.embeds.push({
			author: {
				name: `replying to: ${msg.replyto.author.username}`,
				icon_url: msg.replyto.author.profile
			},
			description: msg.replyto.content
		});
	}
	if (message.embeds?.length == 0) delete message.embeds;
	return message;
}

export function idTransform(msg: BoltMessage<unknown>) {
	const senddat = {
		embeds: [
			{
				author: {
					name: msg.author.username,
					icon_url: msg.author.profile
				},
				description: msg.content,
				footer: {
					text: 'please migrate to webhook bridges'
				}
			},
			...(msg.embeds || []).map(i => {
				return {
					...i,
					timestamp: i.timestamp ? new Date(i.timestamp) : undefined
				};
			})
		]
	};
	if (msg.replyto) {
		senddat.embeds[0].description += `\n**In response to ${msg.replyto.author.username}'s message:**\n${msg.replyto.content}`;
	}
	if (msg.attachments?.length) {
		senddat.embeds[0].description += `\n**Attachments:**\n${msg.attachments
			.map(a => {
				return `![${a.alt || a.name}](${a.file})`;
			})
			.join('\n')}`;
	}
	return senddat;
}
