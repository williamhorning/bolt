import { platforms as BoltPlatforms, boltError } from "../utils.js";
import { getBridges, legacyBridgeDatabase } from "./utils.js";

export async function tryBridgeSend(msg) {
	const { legacy, current } = await getBridges(msg);
	const platforms = legacy
		? await Promise.all(
				Object.keys(legacy)
					.filter((i) => i !== msg.platform)
					.map(async (i) => {
						const bridgeIdentifierLegacy = await legacyBridgeDatabase.get(
							`${i}-${msg.channel}`
						);
						return {
							platform: i,
							senddata: await legacyBridgeDatabase.get(
								`${i}-${bridgeIdentifierLegacy}`
							),
						};
					})
		  )
		: current.bridges.filter((i) => {
				return !(i.platform == msg.platform && i.channel == msg.channel);
		  });
	for (const platform of platforms) {
		if (!platform?.id || !platform?.senddata) continue;
		try {
			await BoltPlatforms[platform.platform].bridgeSend(msg, platform.senddata);
		} catch (e) {
			try {
				await BoltPlatforms[platform.platform].bridgeSend(
					boltError(`sending a message here failed:\n${e.message || e}`, e, {
						msg,
						platform,
						platforms,
					}),
					platform.senddata
				);
			} catch (e2) {
				boltError(`sending an error failed`, e2, {
					msg,
					platform,
					platforms,
					e,
					e2,
				});
				continue;
			}
		}
	}
}

export * from "./utils.js";
