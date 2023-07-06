import { Bolt } from '../bolt.ts';
import { BoltMessage, BoltThread } from '../types.ts';
import { BoltBridgePlatform, BoltBridgeSentPlatform } from './types.ts';
import { getBoltBridge, getBoltBridgedMessage } from './utils.ts';

export async function bridgeBoltMessage(
	bolt: Bolt,
	event:
		| 'messageCreate'
		| 'threadMessageCreate'
		| 'messageUpdate'
		| 'threadMessageUpdate'
		| 'messageDelete',
	message: BoltMessage<unknown>
) {
	const data = [];
	const bridge = await getBoltBridge(bolt, { channel: message.channel });
	if (!bridge) return;
	const platforms: (BoltBridgePlatform | BoltBridgeSentPlatform)[] | false =
		event === 'messageCreate' || event === 'threadMessageCreate'
			? bridge.platforms.filter(i => i.channel !== message.channel)
			: await getBoltBridgedMessage(bolt, message.id);
	if (!platforms || platforms.length < 1) return;
	for (const platform of platforms) {
		const plugin = bolt.getPlugin(platform.plugin);
		if (
			!platform?.senddata ||
			!plugin?.bridgeSupport?.text ||
			!plugin?.bridgeMessage
		)
			continue;
		let threadId;
		if (message.threadId) {
			if (!plugin.bridgeSupport.threads) continue;
			if (event === 'messageCreate' || event === 'threadMessageCreate') {
				threadId = (
					(await bolt.mongo
						.database(bolt.database)
						.collection('threads')
						.findOne({ _id: message.threadId })) as BoltThread | undefined
				)?.id;
			} else {
				threadId = (platform as BoltBridgeSentPlatform).thread?.id;
			}
			if (!threadId) continue;
		}

		const replyto = await getBoltBridgedMessage(bolt, message.replyto?.id);

		const handledat = await plugin.bridgeMessage({
			data: {
				...message,
				...platform,
				threadId,
				replytoId: replyto
					? replyto.find(i => i.channel === platform.channel)?.id
					: undefined,
				bridgePlatform: platform
			},
			event
		});
		data.push(handledat);
	}
	if (event !== 'messageDelete') {
		for (const i of data) {
			// since this key is used to prevent echo, 15 sec expiry should be enough
			await bolt.redis?.set(`message-${i.id}`, JSON.stringify(data), {
				ex: 15
			});
		}
		await bolt.redis?.set(`message-${message.id}`, JSON.stringify(data));
	}
}

export async function bridgeBoltThread(
	bolt: Bolt,
	event: 'threadCreate' | 'threadDelete',
	thread: BoltThread
) {
	const data = [];
	const bridge = await getBoltBridge(bolt, { channel: thread.parent });
	if (!bridge) return;
	const platforms = bridge.platforms.filter(
		(i: BoltBridgePlatform) => i.channel !== thread.parent
	);
	if (!platforms || platforms.length < 1) return;
	for (const platform of platforms) {
		const plugin = bolt.getPlugin(platform.plugin);
		if (
			!platform?.senddata ||
			!plugin?.bridgeSupport?.threads ||
			!plugin?.bridgeThread
		)
			continue;
		const handledat = await plugin.bridgeThread({
			event,
			data: {
				...thread,
				...platform,
				bridgePlatform: platform
			}
		});
		data.push(handledat);
	}
	if (event !== 'threadDelete') {
		for (const i of data) {
			await bolt.mongo
				.database(bolt.database)
				.collection('threads')
				.replaceOne(
					{ _id: i.id },
					{ ...data, _id: thread.id },
					{ upsert: true }
				);
		}
		await bolt.mongo
			.database(bolt.database)
			.collection('threads')
			.replaceOne(
				{ _id: thread.id },
				{ ...data, _id: thread.id },
				{ upsert: true }
			);
	}
}
