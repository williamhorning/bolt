import argvParse from "@williamhorning/arg-parse";
import { boltEmbedMsg } from "../utils.js";

export default async function commandhandle(msg) {
	let arg = argvParse(msg.content);
	arg._.shift();
	let cmd = arg._.shift() || "help";
	try {
		await (await import(`./${cmd}.js`)).default(msg, arg);
	} catch (e) {
		if (e.code == "ERR_MODULE_NOT_FOUND") {
			msg.reply(
				boltEmbedMsg(
					"Bolt",
					"Invalid command. Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/README.md)"
				)
			);
		} else {
			msg.reply(boltError(e.message || e, e, { msg, arg, cmd }));
		}
	}
}
