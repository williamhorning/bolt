import { createMsg } from "../../utils.js";

export default {
	execute: () => {
		return createMsg(
			"Bolt Help",
			"Need help? Take a look at the [docs](https://bolt.williamhorning.dev/docs/Using/)\nNeed more help? Join one of the support servers, which are also linked above."
		);
	},
	metadata: {
		command: "help",
		description: "get some help!",
	},
};
