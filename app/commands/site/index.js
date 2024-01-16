import { createMsg } from "../../utils.js";

export default {
  execute: () => {
    return createMsg("Bolt Website", `https://williamhorning.dev/bolt`);
  },
  metadata: {
    command: "site",
    description: "links to the bolt site",
  },
};
