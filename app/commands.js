import { parseArgs } from "node:util";
import { basename, join } from "path/posix";
import { createMsg, logError } from "./utils.js";

export function handleMessageCommand(msg) {
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
}

export async function commandhandle({
  cmd,
  subcmd = "index",
  channel,
  platform,
  opts,
  timestamp,
  replyfn,
}) {
  let execute;
  if (!subcmd) subcmd = "index";
  try {
    let mod = await import(currentdir(cmd, `${subcmd}.js`));
    execute = mod.default.execute;
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND") {
      execute = () => createMsg("Bolt", "Command not found. Try `!bolt help`");
    } else {
      throw e;
    }
  }
  let reply;
  try {
    reply = await execute({ channel, platform, opts, timestamp });
  } catch (e) {
    reply = await logError(e, {
      cmd,
      subcmd,
      channel,
      platform,
      opts,
      timestamp,
    });
  }
  await replyfn(reply, false);
}

function currentdir(additional = "", thingtosanitize) {
  return join(
    new URL(".", import.meta.url).pathname,
    "commands",
    additional,
    basename(thingtosanitize)
  );
}
