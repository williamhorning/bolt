import argvParse from "@williamhorning/arg-parse";
import { boltEmbedMsg, boltError, currentdir } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg(
			"you've traveled this far but why?",
			"the friends you've made along the way are why you're here, thank them. enjoy life to the fullest, there is so much out there to live for, running the command handler file isn't though. try `!bolt help` or therapy."
		);
	},
	metadata: {},
};

export async function commandhandle(msg) {
	let interaction = await getInteraction(msg);
	try {
		let execute = await getExecuteFunc(interaction);
		let reply = await execute(
			interaction.channel,
			interaction.platform,
			interaction.cmdChannel,
			interaction.opts,
			interaction.msg
		);
		interaction.reply(reply);
	} catch (e) {
		interaction.reply(
			boltError(e.message || e, e, {
				e,
				interaction,
			})
		);
	}
}

function textCommandArgParse(msg) {
	let opts = argvParse(msg.content.trim());
	opts._.shift();
	return {
		cmd: opts._.shift() || "help",
		subcmd: opts._.shift(),
		channel: msg.channel,
		cmdChannel: msg["platform.message"].channel,
		platform: msg.platform,
		opts,
		reply: msg.reply,
		msg,
	};
}

async function discordCommandArgParse(discord_interaction) {
	let opts = {};

	for (let item of discord_interaction.options?.data[0]?.options || []) {
		opts[item.name] = item.value;
	}

	return {
		cmd: discord_interaction.commandName || "help",
		subcmd: discord_interaction.options.getSubcommand(false),
		channel: discord_interaction.channelId,
		cmdChannel: discord_interaction.channel,
		platform: "discord",
		opts,
		reply: (msg) => {
			setTimeout(() => {
				discord_interaction.editReply(msg);
			}, 1000);
		},
		msg: discord_interaction,
	};
}

async function getInteraction(msg) {
	if (msg.boltCommand.type === "discord") {
		return await discordCommandArgParse(msg);
	} else {
		return await textCommandArgParse(msg);
	}
}

async function getExecuteFunc(interaction) {
	let execute;
	try {
		let module = await (
			await import(currentdir(import.meta.url, "", `${interaction.cmd}.js`))
		).default;
		execute = module.execute;
		if (module.metadata.hasSubcommands)
			execute = await (
				await import(
					currentdir(
						import.meta.url,
						interaction.cmd,
						`${interaction.subcmd || "help"}.js`
					)
				)
			).default.execute;
	} catch (e) {
		if (e.code === "ERR_MODULE_NOT_FOUND") {
			execute = () => {
				return boltEmbedMsg(
					"Bolt",
					"Invalid command. Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/README.md)"
				);
			};
		} else {
			throw e;
		}
	}

	return execute;
}
