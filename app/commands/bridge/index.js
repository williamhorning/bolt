import { createMsg } from "../../utils.js";

export default {
	execute: () => {
		return createMsg(
			"Bolt Bridges",
			"Bridges are a cool part of bolt that let you bridge messages between platforms. To get started, take a look at the [docs](https://github.com/williamhorning/bolt/tree/main/docs)"
		);
	},
	metadata: {
		command: "bridge",
		description: "connect different chat apps",
		hasSubcommands: true,
	},
};
