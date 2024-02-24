import { API, message, Message, TextEmbed } from './deps.ts';
import RevoltPlugin from './mod.ts';

export async function coreToMessage(
	message: message<unknown>,
	masquerade = true
): Promise<Omit<API.DataMessageSend, 'nonce'>> {
	const dat: API.DataMessageSend = {
		attachments:
			message.attachments && message.attachments.length > 0
				? await Promise.all(
						message.attachments.map(async ({ file, name }) => {
							const formdata = new FormData();
							formdata.append(
								'file',
								new File(
									[await (await fetch(file)).arrayBuffer()],
									name || 'file.name',
									{
										type: 'application/octet-stream'
									}
								)
							);
							return (
								await (
									await fetch(`https://autumn.revolt.chat/attachments`, {
										method: 'POST',
										body: formdata
									})
								).json()
							)?.id;
						})
				  )
				: undefined,
		content: message.content
			? message.content
			: message.embeds
			? undefined
			: 'empty message',
		embeds: message.embeds?.map(embed => {
			if (embed.fields) {
				for (const field of embed.fields) {
					embed.description += `\n\n**${field.name}**\n${field.value}`;
				}
			}
			return embed;
		}),
		masquerade: masquerade
			? {
					avatar: message.author.profile,
					name: message.author.username,
					colour: message.author.color
			  }
			: undefined
	};

	if (!dat.attachments) delete dat.attachments;
	if (!dat.masquerade) delete dat.masquerade;
	if (!dat.content) delete dat.content;
	if (!dat.embeds) delete dat.embeds;

	return dat;
}

export async function messageToCore(
	plugin: RevoltPlugin,
	message: Message,
	getReply = true
): Promise<message<Message>> {
	return {
		author: {
			username:
				message.member?.displayName ||
				message.author?.username ||
				`${message.authorId || 'unknown user'} on revolt`,
			rawname:
				message.author?.username ||
				`${message.authorId || 'unknown user'} on revolt`,
			profile: message.author?.avatarURL,
			id: message.authorId || 'unknown',
			color: '#FF4654'
		},
		channel: message.channelId,
		id: message.id,
		timestamp: Temporal.Instant.fromEpochMilliseconds(
			message.createdAt.valueOf()
		),
		embeds: (message.embeds as TextEmbed[] | undefined)?.map(i => {
			return {
				icon_url: i.iconUrl ? i.iconUrl : undefined,
				type: 'Text',
				description: i.description ? i.description : undefined,
				title: i.title ? i.title : undefined,
				url: i.url ? i.url : undefined
			};
		}),
		platform: { name: 'bolt-revolt', message },
		reply: async (msg: message<unknown>, masquerade = true) => {
			message.reply(await coreToMessage(msg, masquerade as boolean));
		},
		attachments: message.attachments?.map(
			({ filename, size, downloadURL, isSpoiler }) => {
				return {
					file: downloadURL,
					name: filename,
					spoiler: isSpoiler,
					size: (size || 1) / 1000000
				};
			}
		),
		content: message.content,
		replyto: await replyto(plugin, message, getReply)
	};
}

async function replyto(
	plugin: RevoltPlugin,
	message: Message,
	getReply: boolean
) {
	if (message.replyIds && message.replyIds.length > 0 && getReply) {
		try {
			return await messageToCore(
				plugin,
				await plugin.bot.messages.fetch(message.channelId, message.replyIds[0]),
				false
			);
		} catch {
			return;
		}
	}
	return;
}
