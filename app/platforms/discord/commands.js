import {
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { readdir } from "fs/promises";

export async function registerCommands() {
  let cmds = await getCommands();

  const rest = new REST({
    version: "10",
  }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(`/applications/${process.env.DISCORD_CLIENTID}/commands`, {
      body: cmds,
    });
  } catch (error) {
    throw error;
  }
}

async function getCommands() {
  let cmds = [];

  for await (let file of await readdir("app/commands", { recursive: true })) {
    if (file === "index.js") continue;

    let meta = await (
      await import(`./commands/${file}/index.js`)
    )?.default?.metadata;

    if (!meta || meta.hidden === true) continue;

    let cmd = new SlashCommandBuilder()
      .setName(meta.command)
      .setDescription(meta.description);

    await handleMetadata(meta, cmd);

    cmds.push(cmd);
  }

  return cmds;
}

async function handleMetadata(meta, cmd) {
  if (meta.hasSubcommands) {
    for await (let file of await readdir(`app/commands/${meta.command}/`)) {
      if (!file.endsWith(".js") || file.includes("index")) continue;

      let meta2 = await (
        await import(`./commands/${meta.command}/${file}`)
      ).default.metadata;

      if (!meta2 || meta2.hidden === true) continue;

      let subcmd = new SlashCommandSubcommandBuilder()
        .setName(meta2.command)
        .setDescription(meta2.description);

      if (meta2.hasOptions) {
        handleOpts(meta2, subcmd);
      }

      cmd.addSubcommand(subcmd);
    }
  }

  if (meta.hasOptions) {
    handleOpts(meta, cmd);
  }
}

function handleOpts(meta, cmd) {
  for (let item in meta.options) {
    let i = meta.options[item];
    let choices = i.expectedValues?.map((a) => {
      return {
        name: a,
        value: a,
      };
    });
    let opt = new SlashCommandStringOption()
      .setName(item)
      .setDescription(i.description || "option")
      .setRequired(i.required || false);
    if (choices) {
      opt.setChoices(...choices);
    }
    cmd.addStringOption(opt);
  }
}
