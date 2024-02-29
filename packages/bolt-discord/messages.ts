import {
	API,
	RawFile,
	message,
	update_data,
	wh_query,
	wh_token
} from './_deps.ts';

export async function async_flat<A, B>(arr: A[], f: (a: A) => Promise<B>) {
	return (await Promise.all(arr.map(f))).flat();
}

export function id_to_temporal(id: string) {
	return Temporal.Instant.fromEpochMilliseconds(
		Number(BigInt(id) >> 22n) + 1420070400000
	);
}

export function tocore(
	api: API,
	message: Omit<update_data, 'mentions'>
): message<Omit<update_data, 'mentions'>> {
	if (message.flags && message.flags & 128) message.content = 'Loading...';
	const data = {
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
		timestamp: id_to_temporal(message.id),
		embeds: message.embeds?.map(i => {
			return {
				...i,
				timestamp: i.timestamp ? Number(i.timestamp) : undefined
			};
		}),
		reply: async (msg: message<unknown>) => {
			if (!data.author.id || data.author.id == '') return;
			await api.channels.createMessage(message.channel_id, {
				...(await todiscord(msg)),
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
	return data;
}

export async function todiscord(
	message: message<unknown>
): Promise<wh_query & wh_token & { files?: RawFile[]; wait: true }> {
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
			? await async_flat(message.attachments, async a => {
					if (a.size > 25) return [];
					if (!a.name) a.name = a.file.split('/').pop();
					return [
						{
							name: a.name || 'file',
							data: new Uint8Array(await (await fetch(a.file)).arrayBuffer())
						}
					];
			  })
			: undefined,
		username: message.author.username,
		wait: true
	};
}
