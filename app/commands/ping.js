import { boltEmbedMsg } from "../utils.js";

export default {
  execute: (_, _1, _2, _3, msg) => {
    return boltEmbedMsg(
      "Pong! 🏓",
      `Bolt works, probably. - ${Date.now() - msg.timestamp}ms`
    );
  },
  metadata: {
    command: "ping",
    description: "see if bolt is working and how long it takes to respond",
  },
};
