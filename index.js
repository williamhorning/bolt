import { config } from 'dotenv';
import { Database } from "./db.js";
import discordClient from "./discord.js";
import guildedClient from "./guilded.js";
/*
import revoltClient from "./revolt.js";
*/

config();
globalThis.db = new Database();
await db.setup();

globalThis.dsc = new discordClient(
	process.env.DISCORD_TOKEN,
);

globalThis.gld = new guildedClient(
	process.env.GUILDED_TOKEN,
);

/*
globalThis.rvl = new revoltClient(
	process.env.REVOLT_TOKEN,
);
*/

dsc.on("message", async (...args) => {
	await gld.legacyBridgeSend(...args);
})

gld.on("message", async (...args) => {
	await dsc.legacyBridgeSend(...args);
})
