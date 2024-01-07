import { Client } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { EventEmitter } from "events";
import { registerEvents } from "./events.js";
import { coreToMessage } from "./message.js";

export default class DiscordPlugin extends EventEmitter {
  constructor({ token }) {
    super();
    this.rest = new REST({ version: "10", makeRequest: fetch }).setToken(token);
    this.gateway = new WebSocketManager({
      rest: this.rest,
      token,
      intents: 33281,
      initialPresence: {
        since: 0,
        afk: true,
        status: "idle",
        activities: [{ name: `tricks`, type: 0 }],
      },
    });
    this.bot = new Client({ rest: this.rest, gateway: this.gateway });
    registerEvents(this);
    this.gateway.connect();
  }

  get userid() {
    return;
  }

  isBridged() {
    return "query";
  }

  async createSenddata(channel) {
    const webhook = await this.bot.api.channels.createWebhook(channel, {
      name: "Bolt Bridges",
    });
    return {
      id: webhook.id,
      token: webhook.token,
    };
  }

  async bridgeSend(msg, senddata) {
    const result = await this.bot.api.webhooks.execute(
      senddata.id,
      senddata.token,
      coreToMessage(msg),
      { wait: true }
    );
    return {
      message: result.id,
      channel: result.channel_id,
      platform: "discord",
    };
  }
}
