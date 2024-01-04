import { basename, join } from "path/posix";
import { createMsg, logError } from "./utils.js";

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
    let mod = await import(currentdir(import.meta.url, cmd, `${subcmd}.js`));
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

function currentdir(importmetaurl, additional = "", thingtosanitize) {
  return join(
    new URL(".", importmetaurl).href,
    "commands",
    additional,
    basename(thingtosanitize)
  );
}
