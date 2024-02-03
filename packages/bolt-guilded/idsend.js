export async function idSend(msg, id, guilded) {
	const ch = await guilded.channels.fetch(id);
	const senddat = {
		embeds: [
			{
				author: {
					name: msg.author.username,
					icon_url: msg.author.profile
				},
				description: msg.content,
				footer: {
					text: 'try setting up this bridge again for webhooks'
				}
			},
			...(msg.embeds || [])
		]
	};
	if (msg.replyto) {
		senddat.embeds[0].description += `\n**In response to ${msg.replyto.author.username}'s message:**\n${msg.replyto.content}`;
	}
	if (msg.attachments?.length > 0) {
		senddat.embeds[0].description += `\n**Attachments:**\n${msg.attachments
			.map(a => {
				return `![${a.alt || a.name}](${a.file})`;
			})
			.join('\n')}`;
	}
	const execute = await ch.send(senddat);
	return {
		channel: ch,
		platform: 'guilded',
		message: execute.id
	};
}
