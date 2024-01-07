import { logError, platforms } from "../utils.js";
import { getBridge, updateBridge } from "./utils.js";

export async function bridgeMessage(msg) {
  const current = await getBridge(msg);
  if (!current) return;

  for (const bridge of filter_bridge_platforms(current, msg)) {
    if (!bridge?.platform || !bridge?.senddata) continue;
    try {
      await platforms[bridge.platform].bridgeSend(msg, bridge.senddata);
    } catch (e) {
      handleBridgeError(e, msg, bridge, current);
    }
  }
}

async function handleBridgeError(e, msg, bridge, current) {
  if (e.response?.status === 404) {
    let updated_bridge = {
      ...current,
      value: { bridges: current.value.bridges.filter((i) => i !== bridge) },
    };
    await updateBridge(updated_bridge);
    return;
  }
  let err = await logError(e, { msg, bridge });
  try {
    await platforms[bridge.platform].bridgeSend(err, bridge.senddata, false);
  } catch (e2) {
    await logError(
      new Error(`sending error message for ${err.uuid} failed`, {
        cause: [e2],
      })
    );
  }
}

function filter_bridge_platforms(current, msg) {
  return current.value.bridges.filter((i) => {
    return !(i.platform == msg.platform && i.channel == msg.channel);
  });
}

export * from "./utils.js";
