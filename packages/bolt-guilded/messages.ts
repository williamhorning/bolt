import {
	APIEmbed,
	embed,
	EmbedPayload,
	Message,
	message,
	RESTPostWebhookBody
} from './deps.ts';
import { guilded_plugin } from './mod.ts';

export async function tocore(
	message: Message,
	plugin: guilded_plugin
): Promise<message<Message> | undefined> {
	if (!message.serverId) return;
	let author;
	if (!message.createdByWebhookId) {
		author = await plugin.bot.members.fetch(message.serverId, message.authorId);
	}
	const update_content = message.content.replaceAll('\n```\n```\n', '\n');
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
			await message.reply(await toguilded(msg));
		},
		content: update_content,
		replytoid: message.isReply ? message.replyMessageIds[0] : undefined
	};
}

export async function toguilded(
	msg: message<unknown>,
	channel?: string,
	plugin?: guilded_plugin
): Promise<guilded_msg> {
	const message: guilded_msg = {
		content: msg.content,
		avatar_url: msg.author.profile,
		username: get_valid_username(msg),
		embeds: [
			...fix_embed<string>(msg.embeds, String),
			...(await get_reply_embeds(msg, channel, plugin))
		]
	};

	if (msg.replytoid) message.replyMessageIds = [msg.replytoid];

	if (msg.attachments?.length) {
		if (!message.embeds) message.embeds = [];
		message.embeds.push({
			title: 'attachments',
			description: msg.attachments
				.slice(0, 5)
				.map(a => {
					return `![${a.alt || a.name}](${a.file})`;
				})
				.join('\n')
		});
	}

	if (message.embeds?.length == 0 || !message.embeds) delete message.embeds;

	return message;
}

export async function toguildedid(
	msg: message<unknown>,
	channel?: string,
	plugin?: guilded_plugin
) {
	const senddat: guilded_msg & {
		embeds: APIEmbed[];
	} = {
		embeds: [
			...fix_embed<Date>(
				[
					{
						author: {
							name: msg.author.username,
							icon_url: msg.author.profile
						},
						description: msg.content || '*empty message*',
						footer: {
							text: 'please migrate to webhook bridges'
						}
					},
					...(msg.embeds || [])
				],
				d => {
					return new Date(d);
				}
			),
			...(await get_reply_embeds(msg, channel, plugin))
		]
	};
	if (msg.attachments?.length) {
		senddat.embeds[0].description += `\n**Attachments:**\n${msg.attachments
			.slice(0, 5)
			.map(a => {
				return `![${a.alt || a.name}](${a.file})`;
			})
			.join('\n')}`;
	}
	return senddat;
}

type guilded_msg = RESTPostWebhookBody & { replyMessageIds?: string[] };

function get_valid_username(msg: message<unknown>) {
	if (is_valid_username(msg.author.username)) {
		return msg.author.username;
	} else if (is_valid_username(msg.author.rawname)) {
		return msg.author.rawname;
	} else {
		return `${msg.author.id}`;
	}
}

function is_valid_username(e: string) {
	if (!e || e.length === 0 || e.length > 32) return false;
	return /^[a-zA-Z0-9_ ()]*$/gms.test(e);
}

async function get_reply_embeds(
	msg: message<unknown>,
	channel?: string,
	plugin?: guilded_plugin
) {
	if (!msg.replytoid || !channel || !plugin) return [];
	try {
		const msg_replied_to = await plugin.bot.messages.fetch(
			channel,
			msg.replytoid
		);
		let author;
		if (!msg_replied_to.createdByWebhookId) {
			author = await plugin.bot.members.fetch(
				msg_replied_to.serverId!,
				msg_replied_to.authorId
			);
		}
		return [
			{
				author: {
					name: `reply to ${author?.nickname || author?.username || 'a user'}`,
					icon_url: author?.user?.avatar || undefined
				},
				description: msg_replied_to.content
			},
			...(msg_replied_to.embeds || [])
		] as EmbedPayload[];
	} catch {
		return [];
	}
}

function fix_embed<t>(embeds: embed[] = [], timestamp_fix: (s: number) => t) {
	return embeds.flatMap(embed => {
		Object.keys(embed).forEach(key => {
			embed[key as keyof embed] === null
				? (embed[key as keyof embed] = undefined)
				: embed[key as keyof embed];
		});
		if (!embed.description || embed.description == '') return [];
		return [
			{
				...embed,
				timestamp: embed.timestamp ? timestamp_fix(embed.timestamp) : undefined
			}
		];
	}) as (EmbedPayload & { timestamp: t })[];
}
