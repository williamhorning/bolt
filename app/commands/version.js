import { boltEmbedMsg, version, displayname } from "../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg("Version", `Hello from ${displayname} v${version}!`)
	},
	metadata: {
		command: "version",
		description: "see what version bolt is",
	},
};
