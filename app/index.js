import "dotenv/config";
import { parseArgs } from "node:util";
import { isbridged, tryBridgeSend } from "./bridge.js";
import { commandhandle } from "./commands.js";
import { logFatalError, platforms } from "./utils.js";

process.on("uncaughtException", logFatalError);
process.on("unhandledRejection", logFatalError);

for (const platform in platforms) {
  platforms[platform].on("msgcreate", msgCreate);
}

async function msgCreate(msg) {
  if (await isbridged(platforms, msg)) return;

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

  await tryBridgeSend(msg, platforms);
}
