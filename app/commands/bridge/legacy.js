import { boltEmbedMsg } from "../../utils.js";

export default {
	execute: async () => {
		return boltEmbedMsg(
			"Bolt Bridges (legacy)",
			"Bolt Bridges have been moved to a new command, take a look at the [docs](https://github.com/williamhorning/bolt/tree/main/docs) for more info!"
		);
	},
	metadata: {
		command: "legacy",
		hidden: true,
	},
};
