import { MongoClient } from "mongodb";
import { platforms as boltplatforms, logError } from "./utils.js";

const collection = new MongoClient("mongodb://localhost:27017")
  .db(process.env.prod ? "bolt" : "bolt-canary")
  .collection("bridgev1");

export async function tryBridgeSend(msg) {
  const current = await getBridge(msg);
  if (!current) return;
  const platforms = current.value.bridges.filter((i) => {
    return !(i.platform == msg.platform && i.channel == msg.channel);
  });
  for (const platform of platforms) {
    if (!platform?.platform || !platform?.senddata) continue;
    try {
      await boltplatforms[platform.platform].bridgeSend(msg, platform.senddata);
    } catch (e) {
      try {
        await boltplatforms[platform.platform].bridgeSend(
          await logError(e, {
            msg,
            platform,
            // current,
            e,
          }),
          platform.senddata,
          false
        );
      } catch (e2) {
        await logError(
          new Error(`Sending a message and error failed`, {
            cause: [e2, e],
          }),
          {
            msg,
            platform,
            // current,
            e,
            e2,
          }
        );
        continue;
      }
    }
  }
}

export async function isbridged(
  platforms,
  { author, embeds, replyto, channel, platform, webhookid, masquerade }
) {
  if (
    platform == "revolt" &&
    author.id === platforms.revolt.userid &&
    masquerade
  ) {
    return true;
  } else if (platform == "revolt") {
    return false;
  }

  if (
    platform == "guilded" &&
    author.id === platforms.guilded.userid &&
    embeds &&
    !replyto
  ) {
    return true;
  }

  if (!webhookid) return false;

  const query = {
    "value.bridges.platform": platform,
    "value.bridges.channel": channel,
    "value.bridges.senddata.id": webhookid,
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
