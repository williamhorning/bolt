import type { message, Context } from './deps.ts';
import type { telegram_config } from './mod.ts';

export async function tgtocore(
	ctx: Context,
	cfg: telegram_config
): Promise<message | undefined> {
	if (!ctx.msg) return;
	let msg = ctx.msg;
	if (ctx.editedMessage) msg = ctx.editedMessage;
	const author = await ctx.getAuthor();
	const pfps = await ctx.getUserProfilePhotos({ limit: 1 });
	return {
		author: {
			username: author.user.last_name
				? `${author.user.first_name} ${author.user.last_name}`
				: author.user.first_name,
			rawname: author.user.username || author.user.first_name,
			color: '#24A1DE',
			profile: pfps.total_count
				? `https://api.telegram.org/file/bot${cfg.token}/${
						(await ctx.api.getFile(pfps.photos[0][0].file_id)).file_path
				  }`
				: undefined,
			id: author.user.id.toString()
		},
		channel: msg.chat.id.toString(),
		id: msg.message_id.toString(),
		content: msg.text || '*empty message*',
		timestamp: Temporal.Instant.fromEpochSeconds(msg.edit_date || msg.date),
		plugin: 'bolt-telegram',
		reply: async (msg: message) => {
			// TODO(jersey): find better way to transform content
			await ctx.reply(msg.content || 'no content');
		},
		reply_id: msg.reply_to_message
			? msg.reply_to_message.message_id.toString()
			: undefined
	};
}
