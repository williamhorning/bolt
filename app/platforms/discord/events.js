import {
  ApplicationCommandOptionType,
  GatewayDispatchEvents,
} from "@discordjs/core";
import { constructmsg, coreToMessage } from "./message.js";

export function registerEvents(dsc, bolt) {
  dsc.bot.on(GatewayDispatchEvents.Ready, () => {
    dsc.emit("ready");
  });
  dsc.bot.on(GatewayDispatchEvents.MessageCreate, async (message) => {
    dsc.emit("msgcreate", await constructmsg(message));
  });
  dsc.bot.on(GatewayDispatchEvents.InteractionCreate, (interaction) => {
    if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
    bolt.cmd.runCommand({
      cmd: interaction.data.data.name,
      channel: interaction.data.channel.id,
      platform: "discord",
      guild: interaction.data.guild_id,
      ...get_options(interaction),
      ...transformation_helper(interaction),
    });
  });
}

function get_options(interaction) {
  const discord_options = interaction.data.data.options || [];
  let subcmd = "";
  let opts = {};
  for (let opt of discord_options) {
    if (opt.type === ApplicationCommandOptionType.Subcommand) subcmd = opt.name;
    for (let opt2 of opt.options || []) opts[opt2.name] = opt2.value;
  }
  for (let opt of discord_options[0]?.options || []) {
    if (opt.type === ApplicationCommandOptionType.Subcommand) subcmd = opt.name;
    if (opt.type === ApplicationCommandOptionType.String)
      opts[opt.name] = opt.value;
  }
  return { subcmd, opts };
}

function transformation_helper(interaction) {
  return {
    replyfn: async (msg) => {
      await interaction.api.interactions.reply(
        interaction.data.id,
        interaction.data.token,
        coreToMessage(msg)
      );
    },
    timestamp: new Date(
      Number(BigInt(interaction.data.id) >> 22n) + 1420070400000
    ).getTime(),
  };
}
