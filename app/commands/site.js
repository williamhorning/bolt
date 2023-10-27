import { boltEmbedMsg } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg("Bolt Website", `https://bolt.williamhorning.dev/`);
	},
	metadata: {
		command: "site",
		description: "links to the bolt site",
	},
};
