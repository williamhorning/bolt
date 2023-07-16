import { boltError, platforms } from "../utils.js";
import { getBridges, legacycollection } from "./utils.js";

export async function tryBridgeSend(msg) {
	const { legacy, current } = await getBridges(msg);
	if (!legacy && !current) return;
	const bridgeplatforms = legacy
		? await Promise.all(
				Object.keys(platforms)
					.filter((i) => i !== msg.platform)
					.map(async (i) => {
						return {
							platform: i,
							senddata: (
								await legacycollection.findOne({ _id: `${i}-${legacy.value}` })
							).value,
						};
					})
		  )
		: current.bridges.filter((i) => {
				return !(i.platform == msg.platform && i.channel == msg.channel);
		  });
	for (const platform of bridgeplatforms) {
		if (!platform?.platform || !platform?.senddata) continue;
		try {
			await platforms[platform.platform].bridgeSend(msg, platform.senddata);
		} catch (e) {
			try {
				await platforms[platform.platform].bridgeSend(
					boltError(`sending a message failed:`, e, {
						msg,
						platform,
						platforms: bridgeplatforms,
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
					platforms: bridgeplatforms,
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
