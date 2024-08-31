import { log_error, type embed, type message } from '@jersey/lightning';
import type {
	Channel,
	DataMessageSend,
	Embed,
	Member,
	Message,
	SendableEmbed,
	User,
} from '@jersey/revolt-api-types';
import type { Client } from '@jersey/rvapi';
import { decodeTime } from '@std/ulid';

export async function torvapi(
	api: Client,
	message: message,
	masquerade = true,
): Promise<DataMessageSend> {
	if (
		!message.content && (!message.embeds || message.embeds.length < 1) &&
		(!message.attachments || message.attachments.length < 1)
	) {
		message.content = '*empty message*';
	}

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
	let channel: Channel & { type: 'TextChannel' | 'GroupChannel' };
	let user: User;
	let member: Member | undefined;

	try {
		channel = await api.request(
			'get',
			`/channels/${message.channel}`,
			undefined,
		)

		user = await api.request(
			'get',
			`/users/${message.author}`,
			undefined,
		);

		member = channel.server
			? await api.request(
				'get',
				`/servers/${channel.server}/members/${message.author}`,
				undefined,
			)
			: undefined;
	} catch (e) {
		const err = await log_error(e, {
			message: 'Failed to fetch user or channel data',
			message_id: message._id,
		})

		return err.message;
	}

	return {
		author: {
			id: message.author,
			rawname: message.webhook?.name || user.username,
			username: message.webhook?.name || member?.nickname ||
				user.username,
			color: '#FF4654',
			profile: message.webhook?.avatar || user.avatar
				? `https://autumn.revolt.chat/avatars/${user.avatar?._id}`
				: undefined,
		},
		channel: message.channel,
		id: message._id,
		timestamp: message.edited
			? Temporal.Instant.from(message.edited)
			: Temporal.Instant.fromEpochMilliseconds(decodeTime(message._id)),
		embeds: (message.embeds as Embed[] | undefined)?.map<embed>((i) => {
			return {
				color: i.colour
					? parseInt(i.color.replace('#', ''), 16)
					: undefined,
				...i,
			} as embed;
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
			await api.request(
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
