import { boltEmbedMsg, version } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg("Version", `Hello from Bolt ${version}!`);
	},
	metadata: {
		command: "info",
		description: "see information about bolt",
	},
};
