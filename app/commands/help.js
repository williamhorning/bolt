import { boltEmbedMsg } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg(
			"Bolt Help",
			"Need help? Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/README.md)\nNeed more help? Join one of the support servers:\n - [discord](https://discord.gg/eGq7uhtJDx)\n- [guilded](https://www.guilded.gg/i/kamX0vek)\n - [revolt](https://app.revolt.chat/invite/tpGKXcqk)"
		);
	},
	metadata: {
		command: "help",
		description: "get some help!",
	},
};
