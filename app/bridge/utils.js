import {
	currentcollection,
	legacycollection,
	mongo,
	platforms,
} from "../utils.js";

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
	await legacycollection.deleteOne({
		_id: `${platform}-${name}`,
	});
	await legacycollection.deleteOne({
		_id: `${platform}-${channelId}`,
	});
}
