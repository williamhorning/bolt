import "dotenv/config";
import { REST } from "@discordjs/rest";
import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandStringOption,
} from "@discordjs/builders";
import { Routes } from "discord-api-types/v9";
import { readdir } from "fs/promises";

let cmds = [];

for await (let file of await readdir("app/commands")) {
	if (!(file.endsWith(".js") && file !== "index.js")) continue;

	// import metadata and make builder
	let meta = await (await import(`../app/commands/${file}`)).default.metadata;
	let cmd = new SlashCommandBuilder();
  if (meta.hidden === true) continue;
	cmd.setName(meta.command).setDescription(meta.description);

	// handle more metadata, including subcommands
	await handleMetadata(meta, cmd);

	// add to list of commands
	cmds.push(cmd);
}

async function handleMetadata(meta, cmd) {
	// deal with subcommands
	if (meta.hasSubcommands) {
		for await (let file of await readdir(`app/commands/${meta.command}/`)) {
			// sanity check
			if (!file.endsWith(".js")) continue;

			// import metadata and make builder
			let meta2 = await (
				await import(`../app/commands/${meta.command}/${file}`)
			).default.metadata;
			let subcmd = new SlashCommandSubcommandBuilder();
			subcmd.setName(meta2.command).setDescription(meta2.description);

			// handle options
			if (meta2.hasOptions) {
				handleOpts(meta2, subcmd);
			}

			// register subcommand
			cmd.addSubcommand(subcmd);
		}
	}

	// deal with options
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
		let opt = new SlashCommandStringOption();
		opt.setName(item).setDescription(i.description || 'option').setRequired(i.required || false);
		if (choices) {
			opt.setChoices(...choices);
		}
		cmd.addStringOption(opt);
	}
}

let rest = new REST({
  version: '9',
}).setToken(process.env.DISCORD_TOKEN)

await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENTID), {
	body: cmds,
});

console.log("registered commands")
