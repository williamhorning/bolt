import type {
	API,
	APIInteraction,
	command,
	command_arguments,
	message,
	RawFile,
	update_data,
	wh_query,
	wh_token,
} from './deps.ts';

async function async_flat<A, B>(arr: A[], f: (a: A) => Promise<B>) {
	return (await Promise.all(arr.map(f))).flat();
}

function to_instant(id: string) {
	return Temporal.Instant.fromEpochMilliseconds(
		Number(BigInt(id) >> 22n) + 1420070400000,
	);
}

type discord_message = Omit<update_data, 'mentions'>;

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
			...(replied_message.embeds || []).map((i) => {
				return {
					...i,
					timestamp: i.timestamp ? Number(i.timestamp) : undefined,
					video: i.video ? { ...i.video, url: i.video.url || '' } : undefined,
				};
			}),
		);
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
						data: new Uint8Array(await (await fetch(a.file)).arrayBuffer()),
					},
				];
			})
			: undefined,
		username: message.author.username,
		wait: true,
	};
}

export async function to_core(
	api: API,
	message: discord_message,
): Promise<message> {
	if (message.flags && message.flags & 128) message.content = 'Loading...';
	if (message.type === 7) message.content = '*joined on discord*';
	if (message.sticker_items) {
		if (!message.attachments) message.attachments = [];
		for (const sticker of message.sticker_items) {
			let type;
			if (sticker.format_type === 1) type = 'png';
			if (sticker.format_type === 2) type = 'apng';
			if (sticker.format_type === 3) type = 'lottie';
			if (sticker.format_type === 4) type = 'gif';
			const url = `https://media.discordapp.net/stickers/${sticker.id}.${type}`;
			const req = await fetch(url, { method: 'HEAD' });
			if (req.ok) {
				message.attachments.push({
					url,
					description: sticker.name,
					filename: `${sticker.name}.${type}`,
					size: 0,
					id: sticker.id,
					proxy_url: url,
				});
			} else {
				message.content = '*used sticker*';
			}
		}
	}
	const data = {
		author: {
			profile:
				`https://cdn.discordapp.com/avatars/${message.author?.id}/${message.author?.avatar}.png`,
			username: message.member?.nick ||
				message.author?.global_name ||
				message.author?.username ||
				'discord user',
			rawname: message.author?.username || 'discord user',
			id: message.author?.id || message.webhook_id || '',
			color: '#5865F2',
		},
		channel: message.channel_id,
		content: (message.content?.length || 0) > 2000
			? `${message.content?.substring(0, 1997)}...`
			: message.content,
		id: message.id,
		timestamp: to_instant(message.id),
		embeds: message.embeds?.map((i) => {
			return {
				...i,
				timestamp: i.timestamp ? Number(i.timestamp) : undefined,
			};
		}),
		reply: async (msg: message) => {
			if (!data.author.id || data.author.id === '') return;
			await api.channels.createMessage(message.channel_id, {
				...(await to_discord(msg)),
				message_reference: {
					message_id: message.id,
				},
			});
		},
		plugin: 'bolt-discord',
		attachments: message.attachments?.map((i) => {
			return {
				file: i.url,
				alt: i.description,
				name: i.filename,
				size: i.size / 1000000,
			};
		}),
		reply_id: message.referenced_message?.id,
	};
	return data as message;
}

export function to_command(interaction: { api: API; data: APIInteraction }) {
	if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
	const opts = {} as Record<string, string>;
	let subcmd = '';

	for (const opt of interaction.data.data.options || []) {
		if (opt.type === 1) subcmd = opt.name;
		if (opt.type === 3) opts[opt.name] = opt.value;
	}

	return {
		cmd: interaction.data.data.name,
		subcmd,
		reply: async (msg) => {
			await interaction.api.interactions.reply(
				interaction.data.id,
				interaction.data.token,
				await to_discord(msg),
			);
		},
		channel: interaction.data.channel.id,
		plugin: 'bolt-discord',
		opts,
		timestamp: to_instant(interaction.data.id),
	} as command_arguments;
}

export function to_intent_opts({ options }: command) {
	const opts = [];

	if (options?.argument_name) {
		opts.push({
			name: options.argument_name,
			description: 'option to pass to this command',
			type: 3,
			required: options.argument_required,
		});
	}

	if (options?.subcommands) {
		opts.push(
			...options.subcommands.map((i) => {
				return {
					name: i.name,
					description: i.description || i.name,
					type: 1,
					options: i.options?.argument_name
						? [
							{
								name: i.options.argument_name,
								description: i.options.argument_name,
								type: 3,
								required: i.options.argument_required || false,
							},
						]
						: undefined,
				};
			}),
		);
	}

	return opts;
}
