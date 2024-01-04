import { getBridge, updateBridge } from "../../bridge.js";
import { createMsg } from "../../utils.js";

export default {
  execute: async ({ channel, platform }) => {
    let current = await getBridge({
      platform,
      channel,
    });

    if (!current) {
      return createMsg(
        "Bolt Bridges",
        "To run this you need to be in a bridge."
      );
    }

    current.value.bridges = current.value.bridges.filter(
      (i) => i.channel !== channel && i.platform !== platform
    );

    await updateBridge(current);

    return createMsg("Bolt Bridges", "Left bridge!");
  },
  metadata: {
    command: "leave",
    description: "leave a bridge",
  },
};
