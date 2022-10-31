import "dotenv/config";

import { boltErrorButExit, platforms, getBridges, isbridged } from "./utils.js";

import { legacyBridgeSend, bridgeSend } from "./bridge/index.js";

import commandhandle from "./commands/index.js";

process.on("uncaughtException", boltErrorButExit);
process.on("unhandledRejection", boltErrorButExit);

for (let platform in platforms) {
	platforms[platform].on("msgcreate", msgCreate);
}

async function msgCreate(msg) {
	if (await isbridged(msg)) return;

	let { legacy: legacyID, current: currentID } = await getBridges(msg);

	if (msg.content.startsWith("!bolt")) {
		commandhandle(msg);
	}

	if (legacyID) {
		legacyBridgeSend(msg, legacyID);
	}

	if (currentID?.bridges.length > 0) {
		msg.reply("new bridges aren't avalible, contact william for help.");
		// bridgeSend(msg, currentID);
	}
}
