import { MongoClient } from "mongodb";
import dsc from "./platforms/discord.js";
import gld from "./platforms/guilded.js";
import rvl from "./platforms/revolt.js";

export const prod = process.env.prod;
export const productname = prod ? "bolt" : "bolt-canary";
export const mongo = new MongoClient("mongodb://localhost:27017").db(
	productname
);
export const version = "0.4.10";
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
export const currentcollection = mongo.collection("bridgev1");
export const legacycollection = mongo.collection("bridge");

async function webhookSendError(msg, e, extra, usewebhook = true) {
	if (!process.env.ERROR_HOOK && !usewebhook) return;
	extra.msg = null;
	await fetch(process.env.ERROR_HOOK, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			embeds: [
				{
					title: `Bolt Error`,
					fields: [
						{
							name: `Error: ${msg} on Bolt.`,
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

export function boltError(msg, e, extr, usewebhook) {
	let extra = Object.assign({}, extr);

	if (!prod) {
		console.error(`\x1b[41mBolt Error:\x1b[0m`);
		console.error(msg);
		console.error(e);
		console.log(`\x1b[41mExtra:\x1b[0m`);
		console.log(extra);
	}
	webhookSendError(msg, e, extra, usewebhook);
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
	await webhookSendError("CORE ERROR", e, {});
	process.exit(1);
}

export function boltEmbedMsg(title, description, fields, masq = true) {
	const iconURL =
		"https://cdn.discordapp.com/avatars/946939274434080849/7b51adc6f559655496d081a248b84aeb.webp?size=1024";
	const author = masq
		? {
				username: "Bolt",
				profile: iconURL,
		  }
		: {};
	return {
		author,
		embeds: [
			{
				author: {
					name: "Bolt",
					icon_url: iconURL,
				},
				title,
				description,
				fields,
				footer: { icon: iconURL, text: `Sent by Bolt ${version}` },
			},
		],
		boltError: true,
	};
}
