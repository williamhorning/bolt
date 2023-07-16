import { boltEmbedMsg, version } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg("Version", `Hello from Bolt ${version}!`);
	},
	metadata: {
		command: "version",
		description: "see what version bolt is",
	},
};
