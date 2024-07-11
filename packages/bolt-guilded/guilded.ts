import type {
	Client,
	embed,
	EmbedPayload,
	message,
	RESTPostWebhookBody,
} from './deps.ts';
import type { guilded_plugin } from './mod.ts';

export async function create_webhook(
	bot: Client,
	channel: string,
	token: string,
) {
	const ch = await bot.channels.fetch(channel);
	const resp = await fetch(
		`https://www.guilded.gg/api/v1/servers/${ch.serverId}/webhooks`,
		{
			body: `{"name":"Lightning Bridges","channelId":"${channel}"}`,
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		},
	);
	if (!resp.ok) {
		throw new Error('Webhook creation failed!', {
			cause: await resp.text(),
		});
	}
	const wh = await resp.json();
	return { id: wh.webhook.id, token: wh.webhook.token };
}

type guilded_msg = RESTPostWebhookBody & { replyMessageIds?: string[] };

export async function convert_msg(
	msg: message,
	channel?: string,
	plugin?: guilded_plugin,
): Promise<guilded_msg> {
	const message = {
		content: msg.content,
		avatar_url: msg.author.profile,
		username: get_valid_username(msg),
		embeds: [
			...fix_embed(msg.embeds),
			...(await get_reply_embeds(msg, channel, plugin)),
		],
	} as guilded_msg;

	if (msg.reply_id) message.replyMessageIds = [msg.reply_id];

	if (msg.attachments?.length) {
		if (!message.embeds) message.embeds = [];
		message.embeds.push({
			title: 'attachments',
			description: msg.attachments
				.slice(0, 5)
				.map((a) => {
					return `![${a.alt || a.name}](${a.file})`;
				})
				.join('\n'),
		});
	}

	if (message.embeds?.length === 0 || !message.embeds) delete message.embeds;

	return message;
}

function get_valid_username(msg: message) {
	function valid(e: string) {
		if (!e || e.length === 0 || e.length > 25) return false;
		return /^[a-zA-Z0-9_ ()-]*$/gms.test(e);
	}

	if (valid(msg.author.username)) {
		return msg.author.username;
	} else if (valid(msg.author.rawname)) {
		return msg.author.rawname;
	} else {
		return `${msg.author.id}`;
	}
}

async function get_reply_embeds(
	msg: message,
	channel?: string,
	plugin?: guilded_plugin,
) {
	if (!msg.reply_id || !channel || !plugin) return [];
	try {
		const msg_replied_to = await plugin.bot.messages.fetch(
			channel,
			msg.reply_id,
		);
		let author;
		if (!msg_replied_to.createdByWebhookId) {
			author = await plugin.bot.members.fetch(
				msg_replied_to.serverId!,
				msg_replied_to.authorId,
			);
		}
		return [
			{
				author: {
					name: `reply to ${author?.nickname || author?.username || 'a user'}`,
					icon_url: author?.user?.avatar || undefined,
				},
				description: msg_replied_to.content,
			},
			...(msg_replied_to.embeds || []),
		] as EmbedPayload[];
	} catch {
		return [];
	}
}

function fix_embed(embeds: embed[] = []) {
	return embeds.flatMap((embed) => {
		Object.keys(embed).forEach((key) => {
			embed[key as keyof embed] === null
				? (embed[key as keyof embed] = undefined)
				: embed[key as keyof embed];
		});
		if (!embed.description || embed.description === '') return [];
		return [
			{
				...embed,
				timestamp: embed.timestamp ? String(embed.timestamp) : undefined,
			},
		];
	}) as (EmbedPayload & { timestamp: string })[];
}
