import { createMsg } from "../../utils.js";

export default {
  execute: () => {
    return createMsg(
      "Bolt Help",
      "Need help? Take a look at the [docs](https://williamhorning.dev/bolt/docs/)\nNeed more help? Join one of the support servers, which are also linked above."
    );
  },
  metadata: {
    command: "help",
    description: "get some help!",
  },
};
