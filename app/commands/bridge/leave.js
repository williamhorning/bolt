import { getBridges, leaveLegacy } from "../../bridge/utils.js";
import { boltEmbedMsg, boltError } from "../../utils.js";

export default {
	execute: async ({ channel, platform }) => {
		let { current, legacy: legacyBridgeId } = await getBridges({
			platform,
			channel,
		});

		if (current) {
			return boltEmbedMsg(
				"Bolt Bridges",
				"Please use the API or dash to configure non-legacy bridges."
			);
		}

		try {
			leaveLegacy(legacyBridgeId, channel, platform);
			return boltEmbedMsg("Bolt Bridges (legacy)", "Left bridge.");
		} catch (e) {
			return boltError("Something went wrong trying to leave your bridge", e, {
				channel,
				platform,
			});
		}
	},
	metadata: {
		command: "leave",
		description: "leave a bridge",
	},
};
