import { boltEmbedMsg } from "../../utils.js";

export default {
	execute: () => {
		return boltEmbedMsg(
			"Bolt Bridges",
			`Try using \`!bolt bridge join\` and \`!bolt bridge leave\` to join and leave bridges. Run \`!bolt help\` to get help.`
		);
	},
	metadata: {
		command: "bridge legacy",
		description: "links to the bolt site",
	},
};
