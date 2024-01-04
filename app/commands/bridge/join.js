import { getBridge, updateBridge } from "../../bridge.js";
import { createMsg, platforms } from "../../utils.js";

export default {
  execute: async ({ channel, platform, opts }) => {
    let current = await getBridge({
      platform,
      channel,
    });

    if (opts.bridge === channel) {
      return createMsg(
        "Bolt Bridges",
        "You can't name a bridge the channel ID!"
      );
    }

    if (!opts.bridge) {
      return createMsg(
        "Bolt Bridges",
        "You need to provide a name for your bridge."
      );
    }

    if (current) {
      return createMsg("Bolt Bridges", "You're already in a bridge!");
    }

    opts.bridge = opts.bridge.split(" ")[0];

    const bridge = (await getBridge({ _id: `bridge-${opts.bridge}` })) || {
      _id: `bridge-${opts.bridge}`,
      value: {
        bridges: [],
      },
    };

    bridge.value.bridges.push({
      channel,
      platform,
      senddata: await platforms[platform].createSenddata(channel),
    });

    await updateBridge(bridge);

    return createMsg("Bolt Bridges", "Joined bridge!");
  },
  metadata: {
    command: "join",
    description: "join a bridge",
    hasOptions: true,
    options: {
      bridge: {
        description: "the bridge you want to change",
        required: true,
      },
    },
  },
};
