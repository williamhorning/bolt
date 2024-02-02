export async function joinBoltBridge({ bolt, channel, platform, options }) {
  let name = options.name?.split(" ")[0];
  const current = await bolt.bridge.getBridge({ channel });

  if (current?._id) {
    return {
      message: bolt.createMsg({
        content:
          "To run this command you can't be in a bridge. To learn more, run `!bolt help`.",
      }),
      code: "InBridge",
    };
  }

  if (!name) {
    return {
      message: bolt.createMsg({
        content:
          "Please provide a name for your bridge. To learn more, run `!bolt help`.",
      }),
      code: "MissingParameter",
    };
  }

  const plugin = bolt.getPlugin(platform);

  if (!plugin?.createSenddata) {
    return bolt.logError(new Error(`Can't find plugin while creating bridge`), {
      plugin,
      channel,
      platform,
      name,
      current,
    });
  }

  const bridge = (await bolt.bridge.getBridge({ _id: name })) || {
    _id: name,
    value: { platforms: [] },
  };

  try {
    const senddata = await plugin.createSenddata(channel);

    bridge.value.platforms.push({
      channel,
      platform,
      senddata,
    });

    await bolt.bridge.updateBridge(bridge);
  } catch (e) {
    return bolt.logError(e, { plugin, channel, platform, name, current });
  }
  return {
    message: createBoltMessage({
      content: "Joined a bridge!",
    }),
    code: "OK",
  };
}

export async function leaveBoltBridge({ bolt, channel, platform }) {
  const current = await bolt.bridge.getBridge({ channel });

  if (!current?._id) {
    return {
      message: bolt.createMsg({
        content:
          "To run this command you need to be in a bridge. To learn more, run `!bolt help`.",
      }),
      code: "NotInBridge",
    };
  }

  try {
    await bolt.bridge.updateBridge({
      ...current,
      value: {
        platforms: current.value.platforms.filter(
          (i) => i.channel === channel && i.plugin === platform
        ),
      },
    });
  } catch (e) {
    return bolt.logError(e, { channel, platform, current });
  }
  return {
    message: bolt.createMsg({ content: "Left a bridge!" }),
    code: "OK",
  };
}

export async function resetBoltBridge({ bolt, channel, platform, options }) {
  let name = options.name?.split(" ")[0];
  let result = await leaveBoltBridge({ bolt, channel, platform });
  if (result.code !== "OK" || result.code !== "NotInBridge") {
    return result.message;
  }
  result = await joinBoltBridge({ bolt, channel, platform, options });
  if (result.code !== "OK") return result.message;
  return createBoltMessage({ content: "Reset this bridge!" });
}
