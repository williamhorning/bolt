import argvParse from "@williamhorning/arg-parse";
import "dotenv/config";
import { isbridged, tryBridgeSend } from "./bridge/index.js";
import { commandhandle } from "./commands/index.js";
import { boltErrorButExit, platforms } from "./utils.js";

process.on("uncaughtException", boltErrorButExit);
process.on("unhandledRejection", boltErrorButExit);

for (const platform in platforms) {
	let plat = platforms[platform];
	plat.on("msgcreate", msgCreate);
	plat.on("command", commandhandle);
}

async function msgCreate(msg) {
	if (await isbridged(msg)) return;

	if (msg.content?.startsWith("!bolt")) {
		let opts = argvParse(msg.content.trim());
		opts._.shift();
		commandhandle({
			channel: msg.channel,
			cmd: opts._.shift(),
			subcmd: opts._.shift(),
			guild: msg.guild,
			opts,
			platform: msg.platform,
			timestamp: msg.timestamp,
			replyfn: msg.reply,
		});
	}

	await tryBridgeSend(msg);
}
