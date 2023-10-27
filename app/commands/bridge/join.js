import { getBridges, joinLegacy } from "../../bridge/utils.js";
import { boltEmbedMsg, boltError } from "../../utils.js";

export default {
	execute: async ({ channel, platform, opts, guild }) => {
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

		if (opts.bridge === channel) {
			return boltEmbedMsg(
				"Bolt Bridges (legacy)",
				"You can't name a bridge the channel ID!"
			);
		}
		if (legacyBridgeId) {
			return boltEmbedMsg(
				"Bolt Bridges (legacy)",
				"You're already in a bridge!"
			);
		}

		let bridge_name = opts.bridge || opts.positionals?.shift()

		if (!bridge_name) {
			return boltEmbedMsg(
				"Bolt Bridges (legacy)",
				"You must specify a name for your bridge"
			);
		}

		try {
			joinLegacy(
				bridge_name,
				channel,
				platform,
				guild
			);
			return boltEmbedMsg("Bolt Bridges (legacy)", "Joined bridge!");
		} catch (e) {
			return boltError("Something went wrong trying to join your bridge", e, {
				channel,
				platform,
				opts,
			});
		}
	},
	metadata: {
		command: "join",
		description: "join a bridge",
		hasOptions: true,
		options: {
			bridge: {
				description: "the bridge you want to change",
				required: true,
			},
		},
	},
};
