import { createMsg, version } from "../../utils.js";

export default {
	execute: () => {
		return createMsg("Version", `Hello from Bolt ${version}!`);
	},
	metadata: {
		command: "info",
		description: "see information about bolt",
	},
};
