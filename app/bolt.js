import { BoltCommands } from "./commands.js";
import { BoltBridges } from "./bridge.js";
import { EventEmitter, MongoClient, env, exit, format } from "./deps.js";

export class Bolt extends EventEmitter {
  database = env.MONGO_DB || "bolt";
  collection = "bridgev1";
  plugins = [];
  mongo = new MongoClient(env.MONGO_URL || "mongodb://localhost:27017");
  version = "0.4.14";
  bridge = new BoltBridges(this);
  cmd = new BoltCommands(this);

  getPlugin(name) {
    return this.plugins.find((i) => i.name === name);
  }

  async load(...platforms) {
    for (const platform of platforms) {
      let plat = new platform({
        bolt: this,
        token: env[`${platform.name}_token`],
      });
      plat.on("msgcreate", async (msg) => {
        if (await this.bridge.isBridged(msg)) return;
        this.emit("msgcreate", msg);
      });
      this.plugins.push(plat);
    }
  }

  async run() {
    await this.mongo.connect();
  }

  createMsg({ content, embeds, uuid }) {
    let data = {
      author: {
        username: "Bolt",
        profile:
          "https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024",
      },
      content,
      embeds,
    };
    if (uuid) data.uuid = uuid;
    return data;
  }

  async logError(e, extra = {}, usewebhook = true) {
    let uuid = crypto.randomUUID();
    console.error(`\x1b[41mBolt Error:\x1b[0m ${uuid}`);
    console.error(e, extra);

    if (env.ERROR_HOOK && usewebhook) {
      delete extra.msg;

      await fetch(env.ERROR_HOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: e.message,
              description: `\`\`\`${e.stack}\`\`\`\n\`\`\`js\n${format({
                ...extra,
                uuid,
              })}\`\`\``,
            },
          ],
        }),
      });
    }

    return this.createMsg(
      `Something went wrong!`,
      `Please join one of the support servers for help:
    https://williamhorning.dev/bolt/docs/Using/
    \`\`\`${uuid}\`\`\``,
      uuid
    );
  }

  async logFatalError(e) {
    await this.logError(e, { note: "this is a fatal error, exiting" });
    exit(1);
  }
}
