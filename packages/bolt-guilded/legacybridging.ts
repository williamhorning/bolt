import { create_message, message } from './_deps.ts';
import { toguildedid } from './messages.ts';
import GuildedPlugin from './mod.ts';

export async function bridge_legacy(
	guilded: GuildedPlugin,
	dat: message<unknown>,
	senddata: string
) {
	const channel = await guilded.bot.channels.fetch(senddata);
	try {
		const result = await channel.send(toguildedid({ ...dat }));
		return {
			channel: result.channelId,
			id: result.id,
			plugin: 'bolt-guilded',
			senddata
		};
	} finally {
		try {
			await migrate_bridge(senddata, guilded);
		} catch {
			channel.send(
				toguildedid(
					create_message({
						text: `In the next major version of Bolt, embed-based bridges like this one won't be supported anymore.
									 See https://github.com/williamhorning/bolt/issues/36 for more information.`
					})
				)
			);
		}
	}
}

async function migrate_bridge(channel: string, guilded: GuildedPlugin) {
	if (!guilded.bolt.db.redis.get(`guilded-embed-migration-${channel}`)) {
		await guilded.bolt.db.redis.set(
			`guilded-embed-migration-${channel}`,
			'true'
		);
		const current = await guilded.bolt.bridge.getBridge({ channel: channel });
		if (current) {
			current.platforms[
				current.platforms.findIndex(i => i.channel === channel)
			] = {
				channel,
				plugin: 'bolt-guilded',
				senddata: await guilded.create_bridge(channel)
			};
			await guilded.bolt.bridge.updateBridge(current);
		}
	}
}
