import {
  ActivityType,
  ApplicationCommandOptionType,
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits as Intents,
  PresenceUpdateStatus,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { commandhandle } from "../../commands.js";
import { registerCommands } from "../../registerSlashCommands.js";
import { version } from "../../utils.js";
import BasePlugin from "../common.js";
import { constructmsg, coreToMessage } from "./message.js";

export default class DiscordPlugin extends BasePlugin {
  constructor({ token, register_commands }) {
    super({ token });
    this.rest = new REST({ version: "10", makeRequest: fetch }).setToken(token);
    this.gateway = new WebSocketManager({
      rest: this.rest,
      token,
      intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
      initialPresence: {
        since: 0,
        afk: true,
        status: PresenceUpdateStatus.Idle,
        activities: [
          {
            name: `tricks - version ${version}`,
            type: ActivityType.Playing,
          },
        ],
      },
    });
    this.bot = new Client({ rest: this.rest, gateway: this.gateway });
    this.#registerEvents();
    if (register_commands) registerCommands();
    this.gateway.connect();
  }
  #registerEvents() {
    this.bot.on(GatewayDispatchEvents.Ready, () => {
      this.emit("ready");
    });
    this.bot.on(GatewayDispatchEvents.MessageCreate, async (message) => {
      this.emit("msgcreate", await constructmsg(message));
    });
    this.bot.on(GatewayDispatchEvents.InteractionCreate, (interaction) => {
      if (interaction.data.type !== 2 || interaction.data.data.type !== 1)
        return;
      const opts = interaction.data.data.options || [];
      let subcmd = "";
      let arg = {};
      for (let opt of opts) {
        if (opt.type === ApplicationCommandOptionType.Subcommand)
          subcmd = opt.name;
        for (let opt2 of opt.options || []) arg[opt2.name] = opt2.value;
      }
      for (let opt of opts[0]?.options || []) {
        if (opt.type === ApplicationCommandOptionType.Subcommand)
          subcmd = opt.name;
        if (opt.type === ApplicationCommandOptionType.String)
          arg[opt.name] = opt.value;
      }
      commandhandle({
        cmd: interaction.data.data.name,
        subcmd,
        channel: interaction.data.channel.id,
        platform: "discord",
        guild: interaction.data.guild_id,
        opts: arg,
        timestamp: Date.now(),
        replyfn: async (msg) => {
          await interaction.api.interactions.reply(
            interaction.data.id,
            interaction.data.token,
            coreToMessage(msg)
          );
        },
      });
    });
  }
  get userid() {
    return;
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
