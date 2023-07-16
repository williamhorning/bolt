import { MongoClient } from "mongodb";
import { platforms, productname } from "../utils.js";

const mongo = new MongoClient("mongodb://localhost:27017").db(productname);

export const currentcollection = mongo.collection("bridgev1");
export const legacycollection = mongo.collection("bridge");

export async function getBridges({ platform, channel }) {
	const currentbridge = await currentcollection.findOne({
		"value.bridges.platform": platform,
		"value.bridges.channel": channel,
	});
	return {
		legacy: await mongo
			.collection("bridge")
			.findOne({ _id: `${platform}-${channel}` }),
		current: currentbridge,
	};
}

export async function joinLegacy(name, channelId, platform, guild) {
	const id = await platforms[platform].createSenddata(channelId, guild);
	await legacycollection.insertMany([
		{
			_id: `${platform}-${name}`,
			value: id,
		},
		{
			_id: `${platform}-${channelId}`,
			value: name,
		},
	]);
}

export async function leaveLegacy(name, channelId, platform) {
	await legacycollection.deleteMany([
		{
			_id: `${platform}-${name}`,
		},
		{
			_id: `${platform}-${channelId}`,
		},
	]);
}
