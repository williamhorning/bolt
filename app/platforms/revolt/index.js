import { Client } from "@williamhorning/revolt.js";
import BasePlugin from "../common.js";
import { constructmsg, constructRevoltMessage } from "./message.js";

export default class RevoltPlugin extends BasePlugin {
  constructor({ token }) {
    super({ token });
    this.bot = new Client();
    this.bot.on("ready", () => {
      this.emit("ready");
    });
    this.bot.on("messageCreate", async (message) => {
      if (!message || message.system) return;
      this.emit("msgcreate", await constructmsg(message, this.bot));
    });
    this.bot.loginBot(token);
  }

  get userid() {
    return this.bot.user.id;
  }

  async bridgeSend(msg, id, masq = true) {
    if (!id) return;
    let channel;
    try {
      channel = await this.bot.channels.fetch(id);
    } catch (e) {
      return;
    }
    let message = await constructRevoltMessage(msg, masq);
    try {
      let execute = await channel.sendMessage(message);
      return {
        platform: "revolt",
        channel: id,
        message: execute._id,
      };
    } catch (e) {
      if (e.status === 403) {
        throw new Error("Please enable masquerade permssions in this channel");
      }
      throw e;
    }
  }

  async createSenddata(channelid) {
    const channel = await this.bot.channels.fetch(channelid);
    if (!channel.havePermission("Masquerade")) {
      throw new Error("Please enable masquerade permssions in this channel");
    }
    return channelid;
  }
}
