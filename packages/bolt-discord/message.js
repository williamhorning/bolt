export async function constructmsg({ data: message, api }, exclreply = false) {
	const content =
		!message.content && !message.embeds && message.type === 20
			? 'loading slash command response...'
			: message.content;
	return {
		attachments: message.attachments?.map(i => {
			return {
				file: i.url,
				name: i.filename
			};
		}),
		author: {
			username:
				message.member?.nick || message.author?.username || 'discord user',
			rawname: message.author?.username,
			profile: message.author.avatar
				? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
				: 'https://cdn.discordapp.com/embed/avatars/1.png',
			id: message.author?.id || message.webhook_id || ''
		},
		channel: message.channel_id,
		content,
		embeds: message.embeds?.map(i => {
			return { ...i, timestamp: new Date(i.timestamp).getTime() };
		}),
		guild: message.guild_id,
		id: message.id,
		platform: 'discord',
		reply: async content => {
			await api.channels.createMessage(message.channel_id, {
				...coreToMessage(content),
				message_reference: {
					message_id: message.id
				}
			});
		},
		replyto: await getReply(message, api, exclreply),
		timestamp: new Date(message.timestamp).getTime(),
		webhookid: message.webhook_id
	};
}

async function getReply(message, api, exclreply) {
	if (!message.referenced_message || exclreply) return undefined;
	try {
		return await constructmsg({ data: message.referenced_message, api }, true);
	} catch {
		return;
	}
}

export function coreToMessage(msgd) {
	const msg = Object.assign({}, msgd);
	let content = msg.content?.replace(/!\[(.*)\]\((.+)\)/g, '[$1]($2)');
	if (content?.length == 0) content = null;
	const dscattachments = msg.attachments?.map(crossplat => {
		return {
			attachment: crossplat.file,
			description: crossplat.alt,
			name: crossplat.name
		};
	});
	const dat = {
		content,
		username: msg.author.username,
		avatar_url: msg.author.profile,
		files: dscattachments,
		embeds: [...(msg.embeds || [])]
	};
	if (msg.replyto) {
		dat.embeds.push({
			author: {
				name: `reply to ${msg.replyto.author.username}`,
				icon_url: msg.replyto.author.profile
			},
			description: `${msg.replyto.content} `
		});
		dat.embeds.push(...(msg.replyto.embeds || []));
	}
	return dat;
}
