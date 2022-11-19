import "dotenv/config";

import { boltErrorButExit, platforms, isbridged } from "./utils.js";

import { tryBridgeSend } from "./bridge/index.js";

import commandhandle from "./commands/index.js";

process.on("uncaughtException", boltErrorButExit);
process.on("unhandledRejection", boltErrorButExit);

for (let platform in platforms) {
	platforms[platform].on("msgcreate", msgCreate);
}

async function msgCreate(msg) {
	if (await isbridged(msg)) return;

	if (msg.content.startsWith("!bolt")) {
		commandhandle(msg);
	}

	await tryBridgeSend(msg)
}
