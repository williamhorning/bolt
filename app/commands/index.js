import { basename, join } from "path/posix";
import { boltEmbedMsg, boltError } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg(
			"you've traveled this far but why?",
			"try `!bolt help`"
		);
	},
	metadata: {},
};

export async function commandhandle({
	cmd,
	subcmd,
	channel,
	platform,
	opts,
	timestamp,
	guild,
	replyfn,
}) {
	let reply;
	try {
		let execute;
		try {
			let module = await (
				await import(currentdir(import.meta.url, "", `${cmd}.js`))
			).default;
			execute = module.execute;
			if (module.metadata.hasSubcommands)
				execute = await (
					await import(
						currentdir(import.meta.url, cmd, `${subcmd || "help"}.js`)
					)
				).default.execute;
		} catch (e) {
			if (e.code === "ERR_MODULE_NOT_FOUND") {
				execute = () => {
					return boltEmbedMsg("Bolt", "Command not found. Try `!bolt help`");
				};
			} else {
				throw e;
			}
		}
		reply = await execute({
			channel,
			platform,
			opts,
			timestamp,
			guild,
		});
	} catch (e) {
		reply = boltError("Something went wrong trying to run that command", e, {
			e,
			cmd,
			subcmd,
			channel,
			platform,
			opts,
			timestamp,
			guild,
			replyfn,
		});
	}
	await replyfn(reply, false);
}

function currentdir(importmetaurl, additional = "", thingtosanitize) {
	return join(
		new URL(".", importmetaurl).href,
		additional,
		basename(thingtosanitize)
	);
}
