import {
	API,
	BoltMessage,
	ChannelEditSystemMessage,
	ChannelOwnershipChangeSystemMessage,
	Message,
	TextEmbed,
	TextSystemMessage,
	User,
	UserSystemMessage
} from './deps.ts';
import RevoltPlugin from './mod.ts';

export async function coreToMessage(
	message: BoltMessage<unknown>,
	masquerade = true
): Promise<Omit<API.DataMessageSend, 'nonce'>> {
	return {
		attachments:
			message.attachments && message.attachments.length > 0
				? await Promise.all(
						message.attachments.map(async ({ file }) => {
							const formdat = new FormData();
							formdat.append('file', await (await fetch(file)).blob());
							return (
								await (
									await fetch(`https://autumn.revolt.chat/attachments`, {
										method: 'POST',
										body: formdat
									})
								).json()
							).id;
						})
				  )
				: undefined,
		content: message.content
			? message.content
			: message.embeds
			? undefined
			: 'empty message',
		embeds: message.embeds,
		masquerade: masquerade
			? {
					avatar: message.author.profile,
					name: message.author.username,
					colour: message.author.color
			  }
			: undefined
	};
}

export async function messageToCore(
	plugin: RevoltPlugin,
	message: Message,
	getReply = true
): Promise<BoltMessage<Message>> {
	const content = systemMessages(message);
	return {
		author: {
			username:
				message.member?.nickname ||
				message.author?.username ||
				`${message.authorId || 'unknown user'} on revolt`,
			rawname:
				message.author?.username ||
				`${message.authorId || 'unknown user'} on revolt`,
			profile: message.author?.avatarURL,
			id: message.authorId || 'unknown',
			color: '#ff4654'
		},
		channel: message.channelId,
		id: message.id,
		timestamp: message.createdAt.valueOf(),
		embeds: (message.embeds as TextEmbed[] | undefined)?.map(i => {
			return {
				...i,
				description: i.description ? i.description : undefined,
				title: i.title ? i.title : undefined,
				url: i.url ? i.url : undefined
			};
		}),
		platform: { name: 'bolt-revolt', message },
		reply: async (msg: BoltMessage<unknown>, masquerade = true) => {
			message.reply(await coreToMessage(msg, masquerade));
		},
		attachments: message.attachments?.map(
			({ filename, size, downloadURL, isSpoiler }) => {
				return {
					file: downloadURL,
					name: filename,
					spoiler: isSpoiler, // change if revolt adds spoiler support
					size: (size || 1) / 1000000
				};
			}
		),
		content: content !== null ? content : undefined,
		guild: String(message.channel?.serverId),
		replyto: await replyto(plugin, message, getReply)
	};
}

function systemMessages(message: Message) {
	let content = message.content;
	const systemMessage = message.systemMessage;
	function user<T>(type: 'user' | 'from' | 'to') {
		return (
			((systemMessage as T)[type as keyof T] as User | null)?.username ||
			(systemMessage as T)[`${type}Id` as keyof T]
		);
	}
	if (systemMessage) {
		const type = systemMessage.type;
		const rest = type.split('_');
		rest.shift();
		const action = rest.join(' ');
		if (type === 'text') {
			content = (systemMessage as TextSystemMessage).content;
		} else if (
			[
				'user_added',
				'user_remove',
				'user_joined',
				'user_left',
				'user_kicked',
				'user_banned'
			].includes(type)
		) {
			content = `${user<UserSystemMessage>('user')} ${action}`;
		} else if (type === 'channel_ownership_changed') {
			content = `${user<ChannelOwnershipChangeSystemMessage>(
				'from'
			)} transfered this to ${user('to')}`;
		} else if (
			[
				'channel_description_changed',
				'channel_icon_changed',
				'channel_renamed'
			].includes(type)
		) {
			content = `channel ${action} by ${user<ChannelEditSystemMessage>(
				'from'
			)}`;
		} else {
			content = 'unknown system message';
		}
	}
	return content;
}

async function replyto(
	plugin: RevoltPlugin,
	message: Message,
	getReply: boolean
) {
	if (message.replyIds && message.replyIds.length > 0 && getReply) {
		try {
			return await messageToCore(
				plugin,
				await plugin.bot.messages.fetch(message.channelId, message.replyIds[0]),
				false
			);
		} catch {
			return;
		}
	}
	return;
}
