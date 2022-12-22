import { boltError, platforms } from "../utils.js";
import { legacyBridgeDatabase } from "./utils.js";

export default async function send(msg, bridgeIdentifierLegacy) {
	let lsplatforms = Object.keys(platforms).filter((i) => i != msg.platform);

	for (let platform of lsplatforms) {
		let id = await legacyBridgeDatabase.get(
			`${platform}-${bridgeIdentifierLegacy}`
		);
		if (!id) continue;
		try {
			await platforms[platform].bridgeSend(msg, id);
		} catch (e) {
			await platforms[platform].bridgeSend(
				boltError(`legacy message via bridge to ${platform}`, e, {
					msg,
					platform,
					lsplatforms,
					bridgeIdentifierLegacy,
				}),
				id
			);
		}
	}
}
