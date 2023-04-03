import dsc from "./platforms/discord.js";
import gld from "./platforms/guilded.js";
import rvl from "./platforms/revolt.js";
import { basename, join } from "path/posix";

export const prod = process.env.prod;
export const displayname = prod ? "Bolt" : "Bolt Canary";
export const productname = prod ? "bolt" : "bolt-canary";
export const version = "0.4.8";
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
	if (process.env.ERROR_HOOK) {
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
}

export function boltError(msg, e, extr) {
	let extra = Object.assign({}, extr);
	logEvent("error", { e, msg, extra });
	return boltEmbedMsg(
		`Error on ${displayname}`,
		`Error: ${msg}. Run \`!bolt help\` to get help.`
	);
}

export function boltErrorButExit(e) {
	boltError(`core error: ${e.message || e}`, e, {
		environment: process.env,
		version,
		displayname,
		productname,
	});
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
	return join(
		new URL(".", importmetaurl).href,
		additional,
		basename(thingtosanitize)
	);
}

export function logEvent(eventtype, eventdata) {
	if (eventtype === "error" || eventtype === "criticalerror") {
		webhookSendError(eventdata.msg, displayname, eventdata.e, eventdata.extra);
		console.error(`\x1b[41m${displayname} Error:\x1b[0m`);
		console.error(eventdata);
	} else if (!prod) {
		console.log(`\x1b[42m${displayname} ${eventtype}:\x1b[0m`);
		console.log(eventdata);
	}
}

export async function fetchmessage(platform, channel, id) {
	let rawplat = platforms[platform][platform];
	let fetch2;
	if (bridge.platform == "discord") {
		fetch2 = async (id, channel) => {
			await rawplat.channels.fetch(channel).messages.fetch(id);
		};
	} else {
		fetch2 = async (id) => {
			await rawplat.messages.fetch(id);
		};
	}
  return await fetch2(id, channel);
}
