import dsc from "./platforms/discord.js";
import gld from "./platforms/guilded.js";
import rvl from "./platforms/revolt.js";
import { basename, join } from "path/posix";

export const prod = process.env.prod;
export const displayname = prod ? "Bolt" : "Bolt Canary";
export const productname = prod ? "bolt" : "bolt-canary";
export const version = "0.4.7";
export const iconURL = prod
	? "https://cdn.discordapp.com/avatars/946939274434080849/fdcd9f72ed1f42e9ff99698a0cbf38fb.webp?size=128"
	: "https://cdn.discordapp.com/avatars/1009834424780726414/2445088aa4e68bc9dbd34f32e361e4da.webp?size=128";

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
		`Error on ${displayname}`,
		`Error: ${msg}. Run \`!bolt help\` to get help.`
	);
}

export function boltErrorButExit(e) {
	console.error(`\x1b[41mCORE ERROR:\x1b[0m`);
	console.error(e);
	webhookSendError("CORE ERROR", "CORE", e);
	process.exit(1);
}

export function boltEmbedMsg(title, description, fields) {
	return {
		author: {
			username: displayname,
			profile: iconURL,
		},
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
	};
}

export function currentdir(importmetaurl, additional = "", thingtosanitize) {
	return join(new URL(".", importmetaurl).href, additional, basename(thingtosanitize));
}
