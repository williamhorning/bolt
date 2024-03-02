import {
	APIEmbed,
	embed,
	EmbedPayload,
	message,
	Message,
	RESTPostWebhookBody
} from './_deps.ts';
import { guilded_plugin } from './mod.ts';

export async function tocore(
	message: Message,
	plugin: guilded_plugin
): Promise<message<Message> | undefined> {
	if (!message.serverId) return;
	let author;
	if (!message.createdByWebhookId)
		author = await plugin.bot.members.fetch(message.serverId, message.authorId);
	return {
		author: {
			username: author?.nickname || author?.username || 'user on guilded',
			rawname: author?.username || 'user on guilded',
			profile: author?.user?.avatar || undefined,
			id: message.authorId,
			color: '#F5C400'
		},
		channel: message.channelId,
		id: message.id,
		timestamp: Temporal.Instant.fromEpochMilliseconds(
			message.createdAt.valueOf()
		),
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
			webhookid: message.createdByWebhookId || undefined
		},
		reply: async (msg: message<unknown>) => {
			await message.reply(toguilded(msg));
		},
		content: message.content,
		replytoid: message.isReply ? message.replyMessageIds[0] : undefined
	};
}

export function toguilded(msg: message<unknown>): guilded_msg {
	const message: guilded_msg = {
		content: msg.content,
		avatar_url: msg.author.profile,
		username: get_valid_username(msg),
		embeds: fix_embed<string>(msg.embeds, String)
	};
	if (msg.replytoid) message.replyMessageIds = [msg.replytoid];
	if (message.embeds?.length == 0 || !message.embeds) delete message.embeds;
	return message;
}

export function toguildedid(msg: message<unknown>) {
	const senddat: guilded_msg & {
		embeds: APIEmbed[];
	} = {
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
			...fix_embed<Date>(msg.embeds, d => {
				return new Date(d);
			})
		]
	};
	if (msg.replytoid) {
		senddat.replyMessageIds = [msg.replytoid];
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

type guilded_msg = RESTPostWebhookBody & { replyMessageIds?: string[] };

function get_valid_username(msg: message<unknown>) {
	if (check_username(msg.author.username)) {
		return msg.author.username;
	} else if (check_username(msg.author.rawname)) {
		return msg.author.rawname;
	} else {
		return `${msg.author.id}`;
	}
}

function check_username(e: string) {
	if (!e || e.length === 0 || e.length > 32) return false;
	return /^[a-zA-Z0-9_ ()]*$/gms.test(e);
}

function fix_embed<t>(embeds: embed[] = [], timestamp_fix: (s: number) => t) {
	return embeds.map(embed => {
		Object.keys(embed).forEach(key => {
			embed[key as keyof embed] === null
				? (embed[key as keyof embed] = undefined)
				: embed[key as keyof embed];
		});
		return {
			...embed,
			timestamp: embed.timestamp ? timestamp_fix(embed.timestamp) : undefined
		};
	}) as (EmbedPayload & { timestamp: t })[];
}
