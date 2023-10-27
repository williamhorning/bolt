import { basename, join } from "path/posix";
import dsc from "./platforms/discord.js";
import gld from "./platforms/guilded.js";
import rvl from "./platforms/revolt.js";

export const prod = process.env.prod;
export const displayname = prod ? "Bolt" : "Bolt Canary";
export const productname = prod ? "bolt" : "bolt-canary";
export const version = "0.4.12";
export const iconURL =
	"https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024";

export const platforms = {
	discord: new dsc({
		prod,
		token: process.env.DISCORD_TOKEN,
	}),
	guilded: new gld({
		prod,
		token: process.env.GUILDED_TOKEN,
	}),
	revolt: new rvl({
		prod,
		token: process.env.REVOLT_TOKEN,
	}),
};

async function webhookSendError(msg, name, e, extra) {
	extra.msg = extra.msg ? "see the console" : null;
	await fetch(process.env.ERROR_HOOK, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			embeds: [
				{
					title: `${name} Error`,
					fields: [
						{
							name: `Error: ${msg} on ${name}.`,
							value: `\`\`\`${e}\n\`\`\``,
						},
						{
							name: "Extra context",
							value: `\`\`\`json\n${JSON.stringify(extra, null, 2)}\`\`\``,
						},
					],
				},
			],
		}),
	});
}

export function boltError(msg, e, extr, usewebhook = true) {
	let extra = Object.assign({}, extr);

	if (!prod) {
		console.error(`\x1b[41m${displayname} Error:\x1b[0m`);
		console.error(msg);
		console.error(e);
		console.log(`\x1b[41mExtra:\x1b[0m`);
		console.log(extra);
	}
	if (process.env.ERROR_HOOK && usewebhook) {
		webhookSendError(msg, displayname, e, extra);
	}
	return boltEmbedMsg(
		`Error: ${msg}`,
		`Try running \`!bolt help\` to get help.\n\`\`\`\n${
			e.message || e
		}\n\`\`\``,
		undefined,
		false
	);
}

export async function boltErrorButExit(e) {
	console.error(`\x1b[41mCORE ERROR:\x1b[0m`);
	console.error(e);
	webhookSendError("CORE ERROR", "CORE", e, {});
	process.exit(1);
}

export function boltEmbedMsg(title, description, fields, masq = true) {
	const author = masq
		? {
				username: displayname,
				profile: iconURL,
		  }
		: {};
	return {
		author,
		embeds: [
			{
				author: {
					name: displayname,
					icon_url: iconURL,
				},
				title,
				description,
				fields,
				footer: { icon: iconURL, text: `Sent by ${displayname} ${version}` },
			},
		],
		boltError: true,
	};
}

export function currentdir(importmetaurl, additional = "", thingtosanitize) {
	return join(
		new URL(".", importmetaurl).href,
		additional,
		basename(thingtosanitize)
	);
}
