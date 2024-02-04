import { Bolt } from '../bolt.ts';
import { BoltBridgeDocument, BoltBridgeSentPlatform } from './types.ts';

export async function getBoltBridgedMessage(bolt: Bolt, bCheck: Boolean, id?: string) {
	return JSON.parse((await bolt.redis?.get(`message${bCheck ? "-temp" : ""}-${id}`)) || 'false') as
		| BoltBridgeSentPlatform[]
		| false;
}

export async function getBoltBridge(
	bolt: Bolt,
	{ channel, _id }: { channel?: string; _id?: string }
) {
	let query;
	if (channel) {
		// @ts-ignore: THIS IS A VALID QUERY, DON'T WORRY
		query = { 'platforms.channel': channel };
	} else if (_id) {
		query = { _id };
	} else {
		throw new Error('Must provide one of channel or _id');
	}
	return await bolt.mongo
		.database(bolt.database)
		.collection<BoltBridgeDocument>('bridges')
		.findOne(query);
}

export async function updateBoltBridge(bolt: Bolt, bridge: BoltBridgeDocument) {
	return await bolt.mongo
		.database(bolt.database)
		.collection<BoltBridgeDocument>('bridges')
		.replaceOne({ _id: bridge._id }, bridge, { upsert: true });
}
