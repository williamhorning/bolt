import type {
	Client,
	EmbedPayload,
	RESTPostWebhookBody,
	WebhookPayload,
	embed,
	message
} from './deps.ts';
import { guilded_plugin } from './mod.ts';

export async function create_webhook(
	bot: Client,
	channel: string,
	token: string
) {
	const ch = await bot.channels.fetch(channel);
	const base = 'https://www.guilded.gg/api/v1';
	const srvwhs = await fetch(`${base}/servers/${ch.serverId}/webhooks`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	if (!srvwhs.ok) {
		throw new Error('Server webhooks not found!', {
			cause: await srvwhs.text()
		});
	}
	const srvhooks = (await srvwhs.json()).webhooks;
	const found_wh = srvhooks.find((wh: WebhookPayload) => {
		if (wh.name === 'Lightning Bridges' && wh.channelId === channel) {
			return true;
		}
		return false;
	});
	if (found_wh && found_wh.token) {
		return { id: found_wh.id, token: found_wh.token };
	}
	const new_wh = await fetch(`${base}/servers/${ch.serverId}/webhooks`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: `{"name":"Lightning Bridges","channelId":"${channel}"}`
	});
	if (!new_wh.ok) {
		throw new Error('Webhook creation failed!', {
			cause: await new_wh.text()
		});
	}
	const wh = await new_wh.json();
	if (!wh.token) {
		throw new Error('Webhook lacks token!', {
			cause: JSON.stringify(wh)
		});
	}
	return { id: wh.id, token: wh.token };
}

type guilded_msg = RESTPostWebhookBody & { replyMessageIds?: string[] };

export async function convert_msg(
	msg: message<unknown>,
	channel?: string,
	plugin?: guilded_plugin
): Promise<guilded_msg> {
	const message = {
		content: msg.content,
		avatar_url: msg.author.profile,
		username: get_valid_username(msg),
		embeds: [
			...fix_embed(msg.embeds),
			...(await get_reply_embeds(msg, channel, plugin))
		]
	} as guilded_msg;

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

function get_valid_username(msg: message<unknown>) {
	function valid(e: string) {
		if (!e || e.length === 0 || e.length > 32) return false;
		return /^[a-zA-Z0-9_ ()]*$/gms.test(e);
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

function fix_embed(embeds: embed[] = []) {
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
				timestamp: embed.timestamp ? String(embed.timestamp) : undefined
			}
		];
	}) as (EmbedPayload & { timestamp: string })[];
}
