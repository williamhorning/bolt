import type { Message } from 'guilded.js';
import type { message } from 'lightning';
import { convert_msg } from './guilded.ts';
import type { guilded_plugin } from './mod.ts';

export async function tocore(
	message: Message,
	plugin: guilded_plugin,
): Promise<message | undefined> {
	if (!message.serverId) return;
	let author;
	if (!message.createdByWebhookId && message.authorId !== 'Ann6LewA') {
		author = await plugin.bot.members.fetch(
			message.serverId,
			message.authorId,
		);
	}
	const update_content = message.content.replaceAll('\n```\n```\n', '\n');
	return {
		author: {
			username: author?.nickname || author?.username || 'user on guilded',
			rawname: author?.username || 'user on guilded',
			profile: author?.user?.avatar || undefined,
			id: message.authorId,
			color: '#F5C400',
		},
		channel: message.channelId,
		id: message.id,
		timestamp: Temporal.Instant.fromEpochMilliseconds(
			message.createdAt.valueOf(),
		),
		embeds: message.embeds?.map((embed) => {
			return {
				...embed,
				author: embed.author
					? {
						name: embed.author.name || 'embed author',
						iconUrl: embed.author.iconURL || undefined,
						url: embed.author.url || undefined,
					}
					: undefined,
				image: embed.image || undefined,
				thumbnail: embed.thumbnail || undefined,
				timestamp: embed.timestamp ? Number(embed.timestamp) : undefined,
				color: embed.color || undefined,
				description: embed.description || undefined,
				fields: embed.fields.map((i) => {
					return {
						...i,
						inline: i.inline || undefined,
					};
				}),
				footer: embed.footer || undefined,
				title: embed.title || undefined,
				url: embed.url || undefined,
				video: embed.video || undefined,
			};
		}),
		plugin: 'bolt-guilded',
		reply: async (msg: message) => {
			await message.reply(await convert_msg(msg));
		},
		content: update_content,
		reply_id: message.isReply ? message.replyMessageIds[0] : undefined,
	};
}
