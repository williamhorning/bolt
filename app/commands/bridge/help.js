import { boltEmbedMsg } from "../../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg(
			"Bolt Bridges",
			"Bridges are a cool part of bolt that let you bridge messages between platforms. To get started, take a look at the [docs](https://github.com/williamhorning/bolt/tree/main/docs)"
		);
	},
	metadata: {
		command: "help",
		description: "get help with bolt bridges",
	},
};
