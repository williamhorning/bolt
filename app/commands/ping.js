import { boltEmbedMsg } from "../utils.js";

export default {
	execute: ({ timestamp }) => {
		return boltEmbedMsg(
			"Pong! 🏓",
			`Bolt works, probably. - ${Date.now() - timestamp}ms`
		);
	},
	metadata: {
		command: "ping",
		description: "see if bolt is working and how long it takes to respond",
	},
};
