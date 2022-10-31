import { boltEmbedMsg, version, productname } from "../utils.js";

export default async function ping(msg) {
  msg.reply(boltEmbedMsg("Version", `Hello from ${productname} v${version}!`));
}