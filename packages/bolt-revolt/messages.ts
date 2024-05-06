import type { API, Message, TextEmbed, message } from './deps.ts';

export async function torevolt(
	message: message,
	masquerade = true
): Promise<Omit<API.DataMessageSend, 'nonce'>> {
	const dat: API.DataMessageSend = {
		attachments:
			message.attachments && message.attachments.length > 0
				? await Promise.all(
						message.attachments.slice(0, 5).map(async ({ file, name }) => {
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
									await fetch('https://autumn.revolt.chat/attachments', {
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
					name: message.author.username.slice(0, 32),
					colour: message.author.color
				}
			: undefined,
		replies: message.reply_id
			? [{ id: message.reply_id, mention: true }]
			: undefined
	};

	if (!dat.attachments) delete dat.attachments;
	if (!dat.masquerade) delete dat.masquerade;
	if (!dat.content) delete dat.content;
	if (!dat.embeds) delete dat.embeds;

	return dat;
}

export function tocore(message: Message): message {
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
		plugin: 'bolt-revolt',
		reply: async (msg: message, masquerade = true) => {
			message.reply(await torevolt(msg, masquerade as boolean));
		},
		attachments: message.attachments?.map(
			({ filename, size, isSpoiler, id, tag }) => {
				return {
					file: `https://autumn.revolt.chat/${tag}/${id}/${filename}`,
					name: filename,
					spoiler: isSpoiler,
					size: (size || 1) / 1000000
				};
			}
		),
		content: message.content,
		reply_id: message.replyIds ? message.replyIds[0] : undefined
	};
}
