import {
	BoltBridgeMessage,
	BoltMessage,
	createBoltMessage,
	getBoltBridge,
	updateBoltBridge
} from './deps.ts';
import { idTransform } from './messages.ts';
import GuildedPlugin from './mod.ts';

export async function bridgeLegacy(
	this: GuildedPlugin,
	dat: BoltBridgeMessage,
	senddata: string | { id: string; token: string },
	replyto?: BoltMessage<unknown>
) {
	const channel = await this.bot.channels.fetch(dat.channel);
	const idtrsnd = idTransform({ ...dat, replyto });
	// @ts-ignore
	const result = await channel.send(idtrsnd);
	try {
		return {
			channel: result.channelId,
			id: result.id,
			plugin: 'bolt-guilded',
			senddata
		};
	} finally {
		try {
			if (
				!(await dat.bolt.redis?.get(`guilded-embed-migration-${dat.channel}`))
			) {
				await dat.bolt.redis?.set(
					`guilded-embed-migration-${dat.channel}`,
					'true'
				);
				const currentbridge = await getBoltBridge(dat.bolt, {
					channel: channel.id
				})!;
				const senddata = await this.createSenddata(channel.id);
				if (currentbridge) {
					const index = currentbridge.platforms.findIndex(
						i => (i.channel = channel.id)
					);
					currentbridge.platforms[index] = {
						channel: channel.id,
						plugin: 'bolt-guilded',
						senddata
					};
					await updateBoltBridge(dat.bolt, currentbridge);
				}
			}
		} catch {
			const warning = createBoltMessage({
				content:
					"In the next major version of Bolt, 1.0.0, embed-based bridges like this one won't be supported anymore. Take a look at https://github.com/williamhorning/bolt/issues/36 for more information and how to migrate to webhook-based bridges. This should be the last time you see this message."
			});
			// @ts-ignore
			channel.send(warning);
		}
	}
}
