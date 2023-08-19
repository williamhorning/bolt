import { platforms as BoltPlatforms, boltError } from "../utils.js";
import { getBridges, legacyBridgeDatabase } from "./utils.js";

export async function tryBridgeSend(msg) {
	const { legacy, current } = await getBridges(msg);
	if (!legacy && !current) return;
	const platforms = legacy
		? await Promise.all(
				Object.keys(BoltPlatforms)
					.filter((i) => i !== msg.platform)
					.map(async (i) => {
						return {
							platform: i,
							senddata: await legacyBridgeDatabase.get(`${i}-${legacy}`),
						};
					})
		  )
		: current.bridges.filter((i) => {
				return !(i.platform == msg.platform && i.channel == msg.channel);
		  });
	for (const platform of platforms) {
		if (!platform?.platform || !platform?.senddata) continue;
		try {
			await BoltPlatforms[platform.platform].bridgeSend(msg, platform.senddata);
		} catch (e) {
			try {
				await BoltPlatforms[platform.platform].bridgeSend(
					boltError(`sending a message failed:`, e, {
						msg,
						platform,
						platforms,
						legacy,
						current,
						e,
					}),
					platform.senddata,
					false
				);
			} catch (e2) {
				boltError(`sending an error failed`, e2, {
					msg,
					platform,
					platforms,
					legacy,
					current,
					e,
					e2,
				});
				continue;
			}
		}
	}
}

export * from "./utils.js";
