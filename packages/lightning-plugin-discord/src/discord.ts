import type { RawFile } from '@discordjs/rest';
import type { message } from '@jersey/lightning';
import type {
	GatewayMessageUpdateDispatchData as update_data,
	RESTPostAPIWebhookWithTokenJSONBody as wh_token,
	RESTPostAPIWebhookWithTokenQuery as wh_query,
} from 'discord-api-types';

async function async_flat<A, B>(arr: A[], f: (a: A) => Promise<B>) {
	return (await Promise.all(arr.map(f))).flat();
}

export type discord_message = Omit<update_data, 'mentions'>;

type webhook_message = wh_query & wh_token & { files?: RawFile[]; wait: true };

export async function to_discord(
	message: message,
	replied_message?: discord_message,
): Promise<webhook_message> {
	if (message.reply_id && replied_message) {
		if (!message.embeds) message.embeds = [];
		message.embeds.push(
			{
				author: {
					name: `replying to ${
						replied_message.member?.nick ||
						replied_message.author?.global_name ||
						replied_message.author?.username ||
						'a user'
					}`,
					icon_url:
						`https://cdn.discordapp.com/avatars/${replied_message.author?.id}/${replied_message.author?.avatar}.png`,
				},
				description: replied_message.content,
			},
			...(replied_message.embeds || []).map(
				(i: Exclude<update_data['embeds'], undefined>[0]) => {
					return {
						...i,
						timestamp: i.timestamp ? Number(i.timestamp) : undefined,
						video: i.video ? { ...i.video, url: i.video.url || '' } : undefined,
					};
				},
			),
		);
	}

	if ((!message.content || message.content.length < 1) && !message.embeds) {
		message.content = '*empty message*';
	}

	if (!message.author.username || message.author.username.length < 1) {
		message.author.username = message.author.id;
	}

	return {
		avatar_url: message.author.profile,
		content: message.content,
		embeds: message.embeds?.map((i) => {
			return {
				...i,
				timestamp: i.timestamp ? String(i.timestamp) : undefined,
			};
		}),
		files: message.attachments
			? await async_flat(message.attachments, async (a) => {
				if (a.size > 25) return [];
				if (!a.name) a.name = a.file.split('/').pop();
				return [
					{
						name: a.name || 'file',
						data: new Uint8Array(
							await (await fetch(a.file)).arrayBuffer(),
						),
					},
				];
			})
			: undefined,
		username: message.author.username,
		wait: true,
	};
}
