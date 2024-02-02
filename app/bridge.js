export class BoltBridges {
  constructor(bolt) {
    this.bolt = bolt;
    this.bolt.on("msgcreate", (msg) => this.bridgeMessage(msg));
    this.collection = bolt.mongo.db(bolt.database).collection(bolt.collection);
  }

  async bridgeMessage(msg) {
    const bridge = await this.getBridge(msg);
    if (!bridge) return;

    const platforms = bridge.value.bridges.filter((i) => {
      return !(i.platform == msg.platform && i.channel == msg.channel);
    });

    if (!platforms || platforms.length < 1) return;

    for (const platform of platforms) {
      const plugin = this.bolt.getPlugin(platform.platform);
      if (!platform?.senddata || !plugin) continue;
      try {
        await plugin.bridgeSend(msg, platform.senddata);
      } catch (e) {
        await handleBridgeError(e, msg, bridge, platform, plugin);
      }
    }
  }

  async handleBridgeError(e, msg, bridge, platform, plugin) {
    if (e.response?.status === 404) {
      let updated_bridge = {
        ...bridge,
        value: { bridges: bridge.value.bridges.filter((i) => i !== platform) },
      };
      await this.updateBridge(updated_bridge);
      return;
    }
    let err = await this.bolt.logError(e, { msg, bridge });
    try {
      return await plugin.bridgeSend(err, platform.senddata, false);
    } catch (e2) {
      await this.bolt.logError(
        new Error(`sending error message for ${err.uuid} failed`, {
          cause: [e2],
        })
      );
    }
  }

  async isBridged(msg) {
    let platform_says = await this.bolt.getPlugin(msg.platform).isBridged(msg);
    if (platform_says !== "query") return platform_says;

    if (!msg.webhookid) return false;

    const query = {
      "value.bridges.platform": msg.platform,
      "value.bridges.channel": msg.channel,
      "value.bridges.senddata.id": msg.webhookid,
    };

    return await this.collection.findOne(query);
  }

  async getBridge({ _id, channel }) {
    let query = {};

    if (_id) {
      query._id = _id;
    }
    if (channel) {
      query[`value.bridges.channel`] = channel;
    }
    return (await this.collection.findOne(query)) || undefined;
  }

  async updateBridge(bridge) {
    return await this.collection.replaceOne({ _id: bridge._id }, bridge, {
      upsert: true,
    });
  }
}
