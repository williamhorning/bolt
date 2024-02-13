import {
	bridge_message,
	message,
	getBoltBridge,
	updateBoltBridge
} from './deps.ts';
import { idTransform } from './messages.ts';
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

async function migrate_bridge(
	dat: bridge_message,
	senddata: string,
	guilded: GuildedPlugin
) {
	if (!(await dat.bolt.redis?.get(`guilded-embed-migration-${senddata}`))) {
		await dat.bolt.redis?.set(`guilded-embed-migration-${senddata}`, 'true');
		// TODO: redo this
		const currentbridge = await getBoltBridge(dat.bolt, {
			channel: senddata
		})!;
		const senddata = await guilded.createSenddata(senddata);
		if (currentbridge) {
			const index = currentbridge.platforms.findIndex(
				i => (i.channel = senddata)
			);
			currentbridge.platforms[index] = {
				channel: senddata,
				plugin: 'bolt-guilded',
				senddata
			};
			await updateBoltBridge(dat.bolt, currentbridge);
		}
	}
}
