import "dotenv/config";

import { boltErrorButExit, platforms } from "./utils.js";

import { tryBridgeSend, tryBridgeEdit, tryBridgeDelete, isbridged } from "./bridge/index.js";

import { commandhandle } from "./commands/index.js";

process.on("uncaughtException", boltErrorButExit);
process.on("unhandledRejection", boltErrorButExit);

for (let platform in platforms) {
	let plat = platforms[platform];
	plat.on("msgcreate", msgCreate);
  plat.on("msgedit", msgedit)
  plat.on("msgdelete", msgdelete)
	plat.on("command", commandhandle);
}

async function msgCreate(msg) {
	if (await isbridged(msg)) return;

	if (msg.content.startsWith("!bolt")) {
		msg.boltCommand.type = "text";
		commandhandle(msg);
	}

	await tryBridgeSend(msg);
}

async function msgedit(msg) {
  if (await isbridged(msg)) return;

  await tryBridgeEdit(msg);
}

async function msgdelete(msg) {
  if (await isbridged(msg)) return;

  await tryBridgeDelete(msg);
}