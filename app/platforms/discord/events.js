import {
  ApplicationCommandOptionType,
  GatewayDispatchEvents,
} from "@discordjs/core";
import { commandhandle } from "../../commands.js";
import { constructmsg, coreToMessage } from "./message.js";

export function registerEvents(dsc) {
  dsc.bot.on(GatewayDispatchEvents.Ready, () => {
    dsc.emit("ready");
  });
  dsc.bot.on(GatewayDispatchEvents.MessageCreate, async (message) => {
    dsc.emit("msgcreate", await constructmsg(message));
  });
  dsc.bot.on(GatewayDispatchEvents.InteractionCreate, (interaction) => {
    if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
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
