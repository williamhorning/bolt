import type { API } from '@discordjs/core';
import type { message } from '@jersey/lightning';
import { type discord_message, to_discord } from './discord.ts';

export function instant(id: string) {
	return Temporal.Instant.fromEpochMilliseconds(
		Number(BigInt(id) >> 22n) + 1420070400000,
	);
}

export async function to_message(
	api: API,
	message: discord_message,
): Promise<message> {
	if (message.flags && message.flags & 128) message.content = 'Loading...';

	if (message.type === 7) message.content = '*joined on discord*';

	if (message.sticker_items) {
		if (!message.attachments) message.attachments = [];
		for (const sticker of message.sticker_items) {
			let type;
			if (sticker.format_type === 1) type = 'png';
			if (sticker.format_type === 2) type = 'apng';
			if (sticker.format_type === 3) type = 'lottie';
			if (sticker.format_type === 4) type = 'gif';
			const url = `https://media.discordapp.net/stickers/${sticker.id}.${type}`;
			const req = await fetch(url, { method: 'HEAD' });
			if (req.ok) {
				message.attachments.push({
					url,
					description: sticker.name,
					filename: `${sticker.name}.${type}`,
					size: 0,
					id: sticker.id,
					proxy_url: url,
				});
			} else {
				message.content = '*used sticker*';
			}
		}
	}

	const data = {
		author: {
			profile:
				`https://cdn.discordapp.com/avatars/${message.author?.id}/${message.author?.avatar}.png`,
			username: message.member?.nick ||
				message.author?.global_name ||
				message.author?.username ||
				'discord user',
			rawname: message.author?.username || 'discord user',
			id: message.author?.id || message.webhook_id || '',
			color: '#5865F2',
		},
		channel: message.channel_id,
		content: (message.content?.length || 0) > 2000
			? `${message.content?.substring(0, 1997)}...`
			: message.content,
		id: message.id,
		timestamp: instant(message.id),
		embeds: message.embeds?.map(
			(i: Exclude<typeof message['embeds'], undefined>[0]) => {
				return {
					...i,
					timestamp: i.timestamp ? Number(i.timestamp) : undefined,
				};
			},
		),
		reply: async (msg: message) => {
			if (!data.author.id || data.author.id === '') return;
			await api.channels.createMessage(message.channel_id, {
				...(await to_discord(msg)),
				message_reference: {
					message_id: message.id,
				},
			});
		},
		plugin: 'bolt-discord',
		attachments: message.attachments?.map(
			(i: Exclude<typeof message['attachments'], undefined>[0]) => {
				return {
					file: i.url,
					alt: i.description,
					name: i.filename,
					size: i.size / 1000000,
				};
			},
		),
		reply_id: message.referenced_message?.id,
	};

	return data as message;
}
