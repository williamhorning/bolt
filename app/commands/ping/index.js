import { createMsg } from "../../utils.js";

export default {
  execute: ({ timestamp }) => {
    return createMsg(
      "Pong! 🏓",
      `Bolt works, probably. - ${new Date().getTime() - timestamp}ms`
    );
  },
  metadata: {
    command: "ping",
    description: "see if bolt is working and how long it takes to respond",
  },
};
