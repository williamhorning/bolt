import { collection, platforms } from "../utils.js";

export async function isBridged(msg) {
  let platform_says = await platforms[msg.platform].isBridged(msg);
  if (platform_says !== "query") return platform_says;

  if (!msg.webhookid) return false;

  const query = {
    "value.bridges.platform": msg.platform,
    "value.bridges.channel": msg.channel,
    "value.bridges.senddata.id": msg.webhookid,
  };

  return await collection.findOne(query);
}

export async function getBridge({ _id, platform, channel }) {
  let query = {};
  if (_id) {
    query._id = _id;
  }
  if (platform) {
    query["value.bridges.platform"] = platform;
  }
  if (channel) {
    query["value.bridges.channel"] = channel;
  }
  return (await collection.findOne(query)) || undefined;
}

export async function updateBridge(bridge) {
  return await collection.replaceOne({ _id: bridge._id }, bridge, {
    upsert: true,
  });
}

export * from "./index.js";
