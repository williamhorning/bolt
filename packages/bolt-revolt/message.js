export async function constructmsg(message, revolt) {
	const bg = (await message.author.fetchProfile()).background;
	const msg = {
		content: message.content?.replace(/!\[(.*)\]\((.+)\)/g, '[$1]($2)'),
		author: {
			username:
				message.member?.nickname || message.author?.username || 'revolt user',
			rawname: message.author.username || 'revolt user',
			profile: message.author.avatarURL,
			banner: null,
			id: message.authorId
		},
		replyto:
			message.replyIds?.length > 0
				? await getReply(message, revolt)
				: undefined,
		attachments: getAttachments(message),
		platform: 'revolt',
		channel: message.channelId,
		guild: message.server?.id,
		id: message.id,
		timestamp: message.createdAt.getTime(),
		reply: async (content, masq) => {
			if (typeof content != 'string')
				content = await constructRevoltMessage(content, masq);
			message.reply(content);
		},
		embeds: message.embeds?.filter(embed => {
			if (embed.type !== 'Image') return true;
		}),
		masquerade: message.masquerade
	};
	if (bg) {
		msg.author.banner = `https://autumn.revolt.chat/backgrounds/${
			bg._id
		}/${encodeURI(bg.filename)}`;
	}
	return msg;
}

async function getReply(message, revolt) {
	const msg = await revolt.messages.fetch(
		message.channelId,
		message.replyIds[0]
	);
	if (!msg) return null;
	return {
		content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, '[$1]($2)'),
		author: {
			username: msg.member?.nickname || msg.author.username,
			profile: msg.author.avatarURL
		},
		embeds: msg.embeds
	};
}

function getAttachments(message) {
	return (
		message.attachments?.map(attachment => {
			return {
				file: `https://autumn.revolt.chat/attachments/${
					attachment.id
				}/${encodeURI(attachment.filename)}`,
				alt: attachment.filename,
				spoiler: false,
				name: attachment.filename
			};
		}) || []
	);
}

export async function constructRevoltMessage(msgd, masq = true) {
	const msg = Object.assign({}, msgd);
	return {
		content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, '[$1]($2)'),
		masquerade: masq
			? {
					name: msg.author.username,
					avatar: msg.author.profile
			  }
			: undefined,
		attachments: await constructRevoltAttachments(msg),
		embeds: constructRevoltEmbeds(msg)
	};
}

function constructRevoltEmbeds(msg) {
	const embeds = msg.embeds?.map(mapEmbed) || [];
	if (msg.replyto) {
		const reply_embed = {
			title: `Replying to ${msg.replyto.author.username}'s message`,
			icon_url: msg.replyto.author.profile
		};
		if (msg.replyto.content) reply_embed.description = msg.replyto.content;
		embeds.push(reply_embed, ...(msg.replyto.embeds?.map(mapEmbed) || []));
	}
	return embeds.length > 0 ? embeds : undefined;
}

async function constructRevoltAttachments(msg) {
	if (msg.attachments?.length > 0) {
		const attachments = [];
		for (const attachment of msg.attachments) {
			const formdat = new FormData();
			const req = await fetch(attachment.file);
			const blob = await req.blob();
			formdat.append('file', blob);
			const revoltrequest = await fetch(
				`https://autumn.revolt.chat/attachments`,
				{
					method: 'POST',
					body: formdat
				}
			);
			const revoltjson = await revoltrequest.json();
			if (!revoltjson.id) continue;
			await attachments.push(revoltjson.id);
		}
		return attachments;
	} else {
		return undefined;
	}
}

function mapEmbed(i) {
	if (i.fields) {
		for (const field of i.fields) {
			i.description += `\n**${field.name}**\n${field.value}\n`;
		}
		delete i.fields;
	}
	const data = {
		colour: i.color,
		url: i.url,
		description: i.description,
		iconUrl: i.icon_url,
		type: 'Text',
		title: i.title
	};
	return Object.fromEntries(Object.entries(data).filter(([_, v]) => v != null));
}
