import { boltEmbedMsg, boltError, currentdir } from "../utils.js";

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
		reply = boltError(e.message || e, e, {
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
	await replyfn(reply);
}
