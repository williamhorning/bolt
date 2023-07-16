import { getBridges, joinLegacy, leaveLegacy } from "../../bridge/utils.js";
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

		if (opts.action === "join")
			return handleJoin(channel, platform, legacyBridgeId, guild, opts);
		else if (opts.action === "leave")
			return handleLeave(channel, platform, legacyBridgeId);
		else
			return boltEmbedMsg(
				"Bolt Bridges (legacy)",
				"Bridges are a cool part of bolt that let you bridge messages between platforms. To get started, take a look at the [docs](https://github.com/williamhorning/bolt/tree/main/docs)"
			);
	},
	metadata: {
		command: "legacy",
		description: "configure bolt bridges",
		hasOptions: true,
		options: {
			bridge: {
				description: "the bridge you want to change",
				required: true,
			},
			action: {
				description: "what you want to do",
				expectedValues: ["join", "leave", "help"],
			},
		},
	},
};

function handleJoin(channel, platform, legacyBridgeId, guild, opts) {
	if (opts.bridge === channel) {
		return boltEmbedMsg(
			"Bolt Bridges (legacy)",
			"You can't name a bridge the channel ID!"
		);
	}
	if (legacyBridgeId) {
		return boltEmbedMsg("Bolt Bridges (legacy)", "You're already in a bridge!");
	}
	try {
		joinLegacy(opts.bridge, channel, platform, guild);
		return boltEmbedMsg("Bolt Bridges (legacy)", "Joined bridge!");
	} catch (e) {
		return boltError("Something went wrong trying to join your bridge", e, {
			channel,
			platform,
			opts,
		});
	}
}

function handleLeave(channel, platform, legacyBridgeId) {
	try {
		leaveLegacy(legacyBridgeId, channel, platform);
		return boltEmbedMsg("Bolt Bridges (legacy)", "Left bridge.");
	} catch (e) {
		return boltError("Something went wrong trying to leave your bridge", e, {
			channel,
			platform,
		});
	}
}
