import { boltError, platforms, fetchmessage } from "../utils.js";
import { bridgeDatabase } from "./utils.js";

async function wrapFunc(msg, thisbridge, func, errorfunc) {
	let bridges = thisbridge?.bridges?.filter((i) => {
		return !(i.platform == msg.platform && i.channel == msg.channel);
	});
	let results = [];
	for (let bridge of bridges) {
		let result;
		try {
			result = await func(msg, bridge, bridges);
		} catch (e) {
			result = await errorfunc(e, msg, thisbridge, bridge, bridges);
		}
		results.push(result);
	}
	return results;
}

export async function send(msg, thisbridge) {
	let sentmsgs = await wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge) => {
			return await platforms[bridge.platform].bridgeSend(msg, bridge.senddata);
		},
		async (e, msg, thisbridge, bridge, bridges) => {
			return await platforms[bridge.platform].bridgeSend(
				boltError(`sending a message here (${bridges.platform}) failed`, e, {
					msg,
					thisbridge,
					bridges,
				}),
				bridge.senddata
			);
		}
	);
	bridgeDatabase.put(`message-${msg.id}`, {
		message: {
			platform: msg.platform,
			channel: msg.channel,
			message: msg.id,
		},
		sent_to: sentmsgs,
	});
}

export async function edit(msg, thisbridge) {
	let { sent_to } = await bridgeDatabase.get(`message-${msg.id}`);
	await wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge, bridges) => {
			return await platforms[bridge.platform].bridgeEdit(
				sent_to[bridges.indexOf(bridge)].message,
				msg,
				bridge.senddata
			);
		},
		async (e, msg, bridge, bridges) => {
      // TODO: replace with proper error handling
			(await fetchmessage(bridge.platform, bridges[bridges.indexOf(bridge)].channel, sent_to[bridges.indexOf(bridge)].message)).reply("editing this message failed")
		}
	);
}

export async function delet(msg, thisbridge) {
	let { sent_to } = await bridgeDatabase.get(`message-${msg.id}`);
	await wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge, bridges) => {
			return await platforms[bridge.platform].bridgeDelete(
				sent_to[bridges.indexOf(bridge)].message,
				bridge.senddata,
				sent_to[bridges.indexOf(bridge)].channel // because guilded is stupid and requires almost every single fucking method to include either a fucking channel or guild ID, literally no other platform does this
			);
		},
		async (e, msg, bridge, bridges) => {
      // TODO: replace with proper error handling
			(await fetchmessage(bridge.platform, bridges[bridges.indexOf(bridge)].channel, sent_to[bridges.indexOf(bridge)].message)).reply("deleting this message failed")
		}
	);
}
