import "dotenv/config";
import { parseArgs } from "node:util";
import { tryBridgeSend } from "./bridge/index.js";
import { commandhandle } from "./commands/index.js";
import { boltErrorButExit, platforms } from "./utils.js";

process.on("uncaughtException", boltErrorButExit);
process.on("unhandledRejection", boltErrorButExit);

for (const platform in platforms) {
	let plat = platforms[platform];
	plat.on("msgcreate", msgCreate);
}

async function msgCreate(msg) {
	if (platforms[msg.platform].isBridged(msg)) return;

	if (msg.content?.startsWith("!bolt")) {
		let opts = parseArgs({
			args: msg.content.split(" "),
			strict: false,
		});
		opts.positionals.shift();
		commandhandle({
			channel: msg.channel,
			cmd: opts.positionals.shift(),
			subcmd: opts.positionals.shift(),
			guild: msg.guild,
			opts: opts.values,
			platform: msg.platform,
			timestamp: msg.timestamp,
			replyfn: msg.reply,
		});
	}

	await tryBridgeSend(msg);
}
