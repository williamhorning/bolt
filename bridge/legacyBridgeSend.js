import { boltError, platforms, legacyBridgeDatabase } from "../utils.js";

export default async function send(msg, bridgeIdentifierLegacy) {
	let lsplatforms = Object.keys(platforms).filter((i) => i != msg.platform);

	for (let platform of lsplatforms) {
		let id = await legacyBridgeDatabase.get(
			`${platform}-${bridgeIdentifierLegacy}`
		);
		if (!id) continue;
		let fnname =
			platform != "guilded" || (platform == "guilded" && id?.token)
				? "bridgeSend"
				: "idSend";
		try {
			await platforms[platform][fnname](msg, id);
		} catch (e) {
			await platforms[platform][fnname](
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
