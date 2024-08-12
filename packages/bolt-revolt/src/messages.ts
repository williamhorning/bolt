import type {
	Channel,
	Client,
	DataMessageSend,
	Embed,
	embed,
	Member,
	Message,
	message,
	SendableEmbed,
	User,
} from '../deps.ts';
import { decodeTime } from '../deps.ts';

export async function torvapi(
	api: Client,
	message: message,
	masquerade = true,
): Promise<DataMessageSend> {
	return {
		attachments: message.attachments && message.attachments.length > 0
			? await Promise.all(
				message.attachments.slice(0, 5).map(async ({ file }) => {
					const blob = await (await fetch(file)).blob();
					return await api.media.upload_file('attachments', blob);
				}),
			)
			: undefined,
		content: message.content
			? message.content
			: message.embeds
			? undefined
			: 'empty message',
		embeds: message.embeds?.map<SendableEmbed>((embed) => {
			if (embed.fields) {
				for (const field of embed.fields) {
					embed.description +=
						`\n\n**${field.name}**\n${field.value}`;
				}
			}
			return {
				colour: embed.color,
				description: embed.description,
				icon_url: embed.author?.icon_url,
				media: embed.image?.url,
				title: embed.title,
				url: embed.url,
			} as SendableEmbed;
		}),
		masquerade: masquerade
			? {
				avatar: message.author.profile,
				name: message.author.username.slice(0, 32),
				colour: message.author.color,
			}
			: undefined,
		replies: message.reply_id
			? [{ id: message.reply_id, mention: true }]
			: undefined,
	};
}

export async function fromrvapi(
	api: Client,
	message: Message,
): Promise<message> {
	const channel = await api.api.request(
		'get',
		`/channels/${message.channel}`,
		undefined,
	) as Channel & {
		type: 'TextChannel' | 'GroupChannel';
	};
	const user = await api.api.request(
		'get',
		`/users/${message.author}`,
		undefined,
	) as User;
	const member = channel.server
		? await api.api.request(
			'get',
			`/servers/${channel.server}/members/${message.author}`,
			undefined,
		) as Member
		: undefined;
	return {
		author: {
			id: message.author,
			rawname: message.webhook?.name || user.username,
			username: message.webhook?.name || member?.nickname ||
				user.username,
			color: '#FF4654',
			profile: message.webhook?.avatar || user.avatar
				? `https://autumn.revolt.chat/avatars/${user.avatar}`
				: undefined,
		},
		channel: message.channel,
		id: message._id,
		timestamp: message.edited
			? Temporal.Instant.from(message.edited)
			: Temporal.Instant.fromEpochMilliseconds(decodeTime(message._id)),
		embeds: (message.embeds as Embed[] | undefined)?.map<embed>((i) => {
			return { color: i.colour, ...i } as embed;
		}),
		plugin: 'bolt-revolt',
		attachments: message.attachments?.map((i) => {
			return {
				file:
					`https://autumn.revolt.chat/attachments/${i._id}/${i.filename}`,
				name: i.filename,
				size: i.size,
			};
		}),
		content: message.content ?? undefined,
		reply_id: message.replies && message.replies.length > 0
			? message.replies[0]
			: undefined,
		reply: async (msg: message, masquerade = true) => {
			await api.api.request(
				'post',
				`/channels/${message.channel}/messages`,
				{
					...(await torvapi(
						api,
						{ ...msg, reply_id: message._id },
						masquerade as boolean,
					)),
				},
			);
		},
	};
}
