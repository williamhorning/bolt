import { Bolt } from '../bolt.ts';
import { BoltMessage } from '../mod.ts';
import { BoltMessageBase, BoltThread } from '../types.ts';
import { logBoltError } from '../utils.ts';
import { BoltBridgePlatform, BoltBridgeSentPlatform } from './types.ts';
import { getBoltBridge, getBoltBridgedMessage } from './utils.ts';

export async function bridgeBoltMessage(
	bolt: Bolt,
	type: 'create' | 'update' | 'delete',
	message:
		| (BoltMessageBase<unknown> & {
				replyto?: BoltMessage<unknown>;
		  })
		| BoltMessage<unknown>
) {
	const data = [];
	const bridge = await getBoltBridge(bolt, { channel: message.channel });
	if (!bridge) return;

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

		if (bridge.settings?.realnames && 'author' in message) {
			message.author.username = message.author.rawname;
		}

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
				type
			});
		} catch (e) {
			const error = await logBoltError(bolt, {
				message: `Bridging that message failed`,
				cause: e,
				extra: {
					e,
					type,
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
	type: 'create' | 'delete',
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
				type,
				data: {
					...thread,
					...platform,
					bridgePlatform: platform
				}
			});
			data.push(handledat);
		} catch (e) {
			await bridgeBoltMessage(bolt, 'create', {
				...(
					await logBoltError(bolt, {
						message: `Can't bridge thread events`,
						cause: e,
						extra: { bridge, e, type },
						code: `Thread${type}Failed`
					})
				).boltmessage,
				channel: thread.parent
			});
		}
	}

	if (type !== 'delete') {
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
