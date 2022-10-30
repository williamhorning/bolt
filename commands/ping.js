import { boltEmbedMsg } from "../utils.js";

export default async function ping(msg) {
  msg.reply(boltEmbedMsg("Pong! 🏓", `Bolt works, probably. - ${Date.now() - msg.timestamp}ms`));
}