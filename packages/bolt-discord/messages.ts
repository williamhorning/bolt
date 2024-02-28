import {
	API,
	message,
	Buffer,
	GatewayMessageUpdateDispatchData,
	RawFile,
	RESTPostAPIWebhookWithTokenJSONBody,
	RESTPostAPIWebhookWithTokenQuery
} from './deps.ts';

const asyncFlatMap = <A, B>(arr: A[], f: (a: A) => Promise<B>) =>
	Promise.all(arr.map(f)).then(arr => arr.flat());

export function messageToCore(
	api: API,
	message: GatewayMessageUpdateDispatchData
): message<GatewayMessageUpdateDispatchData> {
	if (message.flags && message.flags & 128) message.content = 'Loading...';
	return {
		author: {
			profile: `https://cdn.discordapp.com/avatars/${message.author?.id}/${message.author?.avatar}.png`,
			username:
				message.member?.nick || message.author?.username || 'discord user',
			rawname: message.author?.username || 'discord user',
			id: message.author?.id || message.webhook_id || '',
			color: '#5865F2'
		},
		channel: message.channel_id,
		content: message.content,
		id: message.id,
		timestamp: Temporal.Instant.from(
			message.edited_timestamp ||
				message.timestamp ||
				String(Number(BigInt(message.id) >> 22n) + 1420070400000)
		),
		embeds: message.embeds?.map(i => {
			return {
				...i,
				timestamp: i.timestamp ? Number(i.timestamp) : undefined
			};
		}),
		reply: async (msg: message<unknown>) => {
			await api.channels.createMessage(message.channel_id, {
				...(await coreToMessage(msg)),
				message_reference: {
					message_id: message.id
				}
			});
		},
		platform: {
			name: 'bolt-discord',
			message,
			webhookid: message.webhook_id
		},
		attachments: message.attachments?.map(i => {
			return {
				file: i.url,
				alt: i.description,
				name: i.filename,
				size: i.size / 1000000
			};
		}),
		replytoid: message.referenced_message?.id
	};
}

export async function coreToMessage(message: message<unknown>): Promise<
	RESTPostAPIWebhookWithTokenJSONBody &
		RESTPostAPIWebhookWithTokenQuery & {
			files?: RawFile[];
			wait: true;
		}
> {
	return {
		avatar_url: message.author.profile,
		content: message.content,
		embeds: message.embeds?.map(i => {
			return {
				...i,
				timestamp: i.timestamp ? String(i.timestamp) : undefined
			};
		}),
		files: message.attachments
			? await asyncFlatMap(message.attachments, async a => {
					if (a.size > 25) return [];
					if (!a.name) a.name = a.file.split('/').pop();
					return [
						{
							name: a.name || 'file',
							data: Buffer.from(await (await fetch(a.file)).arrayBuffer())
						}
					];
			  })
			: undefined,
		username: message.author.username,
		wait: true
	};
}
