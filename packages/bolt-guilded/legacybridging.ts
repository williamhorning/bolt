import { bridge_message, message } from './deps.ts';
import GuildedPlugin from './mod.ts';

export async function bridge_legacy(
	guilded: GuildedPlugin,
	dat: bridge_message,
	senddata: string,
	replyto?: message<unknown>
) {
	const channel = await guilded.bot.channels.fetch(senddata);
	const idtrsnd = idTransform({ ...dat, replyto });
	try {
		// @ts-ignore: for some idiotic reason they use the Embed class instead of the the object's type
		const result = await channel.send(idtrsnd);
		return {
			channel: result.channelId,
			id: result.id,
			plugin: 'bolt-guilded',
			senddata
		};
	} finally {
		try {
			await migrate_bridge(dat, senddata, guilded);
		} catch {
			channel.send(
				"In the next major version of Bolt, 1.0.0, embed-based bridges like this one won't be supported anymore. Take a look at https://github.com/williamhorning/bolt/issues/36 for more information and how to migrate to webhook-based bridges. This should be the last time you see this message."
			);
		}
	}
}

function idTransform(msg: message<unknown>) {
	const senddat = {
		embeds: [
			{
				author: {
					name: msg.author.username,
					icon_url: msg.author.profile
				},
				description: msg.content,
				footer: {
					text: 'please migrate to webhook bridges'
				}
			},
			...(msg.embeds || []).map(i => {
				return {
					...i,
					timestamp: i.timestamp ? new Date(i.timestamp) : undefined
				};
			})
		]
	};
	if (msg.replyto) {
		senddat.embeds[0].description += `\n**In response to ${msg.replyto.author.username}'s message:**\n${msg.replyto.content}`;
	}
	if (msg.attachments?.length) {
		senddat.embeds[0].description += `\n**Attachments:**\n${msg.attachments
			.map(a => {
				return `![${a.alt || a.name}](${a.file})`;
			})
			.join('\n')}`;
	}
	return senddat;
}

async function migrate_bridge(
	dat: bridge_message,
	senddata: string,
	guilded: GuildedPlugin
) {
	if (!dat.bolt.redis.get(`guilded-embed-migration-${senddata}`)) {
		await dat.bolt.redis.set(`guilded-embed-migration-${senddata}`, 'true');
		const current = await dat.bolt.bridge.getBridge({ channel: senddata });
		const webhook = await guilded.createSenddata(senddata);
		if (current) {
			current.platforms[
				current.platforms.findIndex(i => i.channel === senddata)
			] = {
				channel: senddata,
				plugin: 'bolt-guilded',
				senddata: webhook
			};
			await dat.bolt.bridge.updateBridge(current);
		}
	}
}
