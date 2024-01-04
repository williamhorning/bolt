import { getBridge } from "../../bridge.js";
import { createMsg } from "../../utils.js";

export default {
  execute: async ({ channel, platform }) => {
    let bridge = await getBridge({
      channel,
      platform,
    });
    if (!bridge) {
      return createMsg(
        "Bolt Bridge status",
        `You don't have a bridge set up yet. Run \`!bolt help\` to learn how to set one up.`
      );
    } else {
      return createMsg(
        "Bolt Bridge status",
        `You're currently in bridge ${bridge._id}`
      );
    }
  },
  metadata: {
    command: "status",
    description: "see what's going on with your bridge",
  },
};
