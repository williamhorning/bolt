import { createMsg } from "../../utils.js";

export default {
	execute: () => {
		return createMsg("Bolt Website", `https://bolt.williamhorning.dev/`);
	},
	metadata: {
		command: "site",
		description: "links to the bolt site",
	},
};
