import { DiscordMessageParser, to_discord, type message } from './deps.ts';

const discord_parser = new DiscordMessageParser()

export async function coreToMessage(msg: message, channel_id: string, mxid: string, reply?: string, edit?: string) {
	const discord = await to_discord(msg);
	const matrix = await discord_parser.FormatMessage({
		callbacks: {
			// deno-lint-ignore require-await
			getUser: async () => {
				return { mxid, name: msg.author.username };
			},
			// deno-lint-ignore require-await
			getChannel: async () => {
				return { mxid: channel_id, name: '' };
			},
			// deno-lint-ignore require-await
			getEmoji: async () => {
				return null;
			},
		},
	}, {
		...discord,
		id: msg.id,
		author: {
			bot: false,
		},
		content: msg.content ?? 'no content',
		embeds: discord.embeds?.map((i) => {
			return {
				...i,
				fields: i.fields?.map((i) => {
					return { ...i, inline: i.inline ?? false };
				}) ?? [],
				timestamp: i.timestamp ? Number(i.timestamp) : null,
				type: 'rich',
			};
		}) ?? [],
	});

	let related = {};
	
	if (reply) {
		related = {
			event_id: reply,
		};
	} else if (edit) {
		related = {
			rel_type: 'm.replace',
			event_id: edit,
		};
	}

	return {
		...matrix,
		'm.related_to': related,
	};
}
