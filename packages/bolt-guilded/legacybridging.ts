import { create_message, message } from './_deps.ts';
import { toguildedid } from './messages.ts';
import { guilded_plugin } from './mod.ts';

export async function bridge_legacy(
	guilded: guilded_plugin,
	dat: message<unknown>,
	senddata: string
) {
	try {
		const result = await guilded.bot.messages.send(
			senddata,
			toguildedid({ ...dat })
		);
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
			await guilded.bot.messages.send(
				senddata,
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

async function migrate_bridge(channel: string, guilded: guilded_plugin) {
	if (!guilded.bolt.db.redis.get(`guilded-embed-migration-${channel}`)) {
		await guilded.bolt.db.redis.set(
			`guilded-embed-migration-${channel}`,
			'true'
		);
		const current = await guilded.bolt.bridge.get_bridge({ channel: channel });
		if (current) {
			current.platforms[
				current.platforms.findIndex(i => i.channel === channel)
			] = {
				channel,
				plugin: 'bolt-guilded',
				senddata: await guilded.create_bridge(channel)
			};
			await guilded.bolt.bridge.update_bridge(current);
		}
	}
}
