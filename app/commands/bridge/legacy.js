import {
	boltEmbedMsg,
	getBridges,
	joinLegacy,
	leaveLegacy,
	platforms,
	boltError,
} from "../../utils.js";

export default {
	execute: async (channel, platform, cmdchannel, opts) => {
		let { legacy: legacyBridgeId, current: thisbridge } = await getBridges({
			channel,
			platform,
		});

		// sanity check
		if (thisbridge) {
			return boltEmbedMsg(
				"Bolt Bridges",
				"Please use the API or dash to configure non-legacy bridges."
			);
		}

		if (!opts.action) opts.action = "help";
		if (opts.action === "join")
			return handleJoin(channel, platform, legacyBridgeId, cmdchannel, opts);
		if (opts.action === "leave")
			return handleLeave(channel, platform, legacyBridgeId, opts);
		if (opts.action === "help")
			return boltEmbedMsg(
				"Bolt Bridges (legacy)",
				"This is the bridge system from the old Bridge Bot. If you figure it out without help you'd be the first. Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md#legacy) if you want to figure it out."
			);
		return boltEmbedMsg(
			"Bolt Bridges (legacy)",
			"unknown option, take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md#legacy)"
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

function handleJoin(channel, platform, legacyBridgeId, cmdchannel, opts) {
	let createWebhook;
	if (platform === "discord") {
		createWebhook = cmdchannel.createWebhook;
	} else if (platform === "guilded") {
		createWebhook = platforms.guilded.guilded.rest.router.createWebhook;
	}

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
		joinLegacy(opts.bridge, channel, platform, createWebhook);
		return boltEmbedMsg("Bolt Bridges (legacy)", "Joined bridge!");
	} catch (e) {
		return boltError("", e, {
			channel,
			platform,
			opts,
		});
	}
}

function handleLeave(channel, platform, legacyBridgeId) {
	try {
		leaveLegacy(legacyBridgeId, channel, platform);
		return boltEmbedMsg(
			"Bolt Bridges (legacy)",
			"Left bridge. If you have any feedback, join one of the support servers:\n - [discord](https://discord.gg/eGq7uhtJDx)\n- [guilded](https://www.guilded.gg/i/kamX0vek)\n - [revolt](https://app.revolt.chat/invite/tpGKXcqk)"
		);
	} catch (e) {
		return boltError("", e, {
			channel,
			platform,
			opts,
		});
	}
}