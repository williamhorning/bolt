import { Bolt } from '../bolt.ts';
import { BoltMessage, BoltThread } from '../types.ts';
import { logBoltError } from '../utils.ts';
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

	let type: 'create' | 'update' | 'delete';
	if (event === 'messageCreate' || event === 'threadMessageCreate') {
		type = 'create';
	} else if (event === 'messageUpdate' || event === 'threadMessageUpdate') {
		type = 'update';
	} else {
		type = 'delete';
	}

	const platforms: (BoltBridgePlatform | BoltBridgeSentPlatform)[] | false =
		type === 'create'
			? bridge.platforms.filter(i => i.channel !== message.channel)
			: await getBoltBridgedMessage(bolt, message.id);

	if (!platforms || platforms.length < 1) return;

	for (const platform of platforms) {
		const plugin = bolt.getPlugin(platform.plugin);
		if (
			!platform?.senddata ||
			!plugin?.bridgeSupport?.text ||
			!plugin?.bridgeMessage ||
			(message.threadId && !plugin.bridgeSupport.threads)
		)
			continue;

		const threadId = message.threadId
			? type === 'create'
				? (
						(await bolt.mongo
							.database(bolt.database)
							.collection('threads')
							.findOne({ _id: message.threadId })) as BoltThread | undefined
				  )?.id
				: (platform as BoltBridgeSentPlatform).thread?.id
			: undefined;

		const replyto = await getBoltBridgedMessage(bolt, message.replyto?.id);

		const bridgedata = {
			...platform,
			threadId,
			replytoId: replyto
				? replyto.find(i => i.channel === platform.channel)?.id
				: undefined,
			bridgePlatform: platform,
			bolt
		};

		let handledat;

		try {
			handledat = await plugin.bridgeMessage({
				data: { ...message, ...bridgedata },
				event,
				type
			});
		} catch (e) {
			const error = await logBoltError(bolt, {
				message: `Bridging that message failed`,
				cause: e,
				extra: {
					e,
					event,
					replyto,
					message: { ...message, platform: undefined },
					data,
					bridge,
					platforms,
					platform,
					plugin: plugin.name
				},
				code: 'BridgeFailed'
			});
			try {
				handledat = await plugin.bridgeMessage({
					data: {
						...error.boltmessage,
						...bridgedata
					},
					event,
					type
				});
			} catch (e2) {
				await logBoltError(bolt, {
					message: `Can't log bridge error`,
					cause: e2,
					extra: { ...error, e2 },
					code: 'BridgeErrorFailed'
				});
			}
		}

		if (handledat) data.push(handledat);
	}

	if (type !== 'delete') {
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

		try {
			const handledat = await plugin.bridgeThread({
				event,
				type: event === 'threadCreate' ? 'create' : 'delete',
				data: {
					...thread,
					...platform,
					bridgePlatform: platform
				}
			});
			data.push(handledat);
		} catch (e) {
			await bridgeBoltMessage(bolt, 'messageCreate', {
				...(
					await logBoltError(bolt, {
						message: `Can't bridge thread events`,
						cause: e,
						extra: { bridge, e, event },
						code: `${
							event === 'threadCreate' ? 'ThreadCreate' : 'ThreadDelete'
						}Failed`
					})
				).boltmessage,
				channel: thread.parent
			});
		}
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
