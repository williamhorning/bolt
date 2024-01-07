import "dotenv/config";
import { bridgeMessage, isBridged } from "./bridge/index.js";
import { handleMessageCommand } from "./commands.js";
import { logFatalError, platforms } from "./utils.js";

process.on("uncaughtException", logFatalError);
process.on("unhandledRejection", logFatalError);

for (const platform in platforms) {
  platforms[platform].on("msgcreate", msgCreate);
}

async function msgCreate(msg) {
  if (await isBridged(msg)) return;

  handleMessageCommand(msg);

  await bridgeMessage(msg, platforms);
}
