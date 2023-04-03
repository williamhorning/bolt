import * as generalutils from "../utils.js";
import * as bridgeutils from "../bridge/utils.js";
import * as commandstuff from "./index.js";

// @ts-ignore 6133 - this is used when running eval
function log(...args) {
	console.log(...args);
	return args.join("\n");
}

export default {
	execute: async (channel, platform, cmdChannel, opts, msg) => {
		if (msg.boltCommand.type === "discord") {
			return boltEmbedMsg(
				"execute",
				"this doesn't work through slash commands"
			);
		} else if (
			msg.author.id === "360005875697582081" ||
			msg.author.id === "4ornxlYA" ||
			msg.author.id === "01FFDG3TK0AFMPQ6TNE7878YF6"
		) {
			let result = eval(msg.content.split("```")[1]);
			return result;
		} else {
			return generalutils.boltEmbedMsg(
				"execute",
				"this command exists to help debug things, but you don't have permission to use it"
			);
		}
	},
	metadata: {
		command: "execute",
		hidden: true,
	},
};
