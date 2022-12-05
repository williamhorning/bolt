import { boltError, platforms, bridgeDatabase } from "../utils.js";

async function wrapFunc(msg, thisbridge, func, errorfunc) {
	let bridges = thisbridge.bridges.filter((i) => {
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
	await wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge) => {
			return await platforms[bridge.platformm].bridgeEdit(
				msg.id,
				msg,
				bridge.sendData
			);
		},
		async (e, msg, bridge, bridges) => {
			if (msg.platform !== "guilded") {
				return await msg.reply(
					boltError("editing this message failed", e, {
						e,
						msg,
						bridge,
						bridges,
						thisbridge,
					})
				);
			}
		}
	);
}

export async function delet(msg, thisbridge) {
	await wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge) => {
			return await platforms[bridge.platformm].bridgeDelete(
				msg.id,
				bridge.sendData
			);
		},
		async (e, msg, bridge, bridges) => {
			return await msg.reply(
				boltError("deleting this message failed", e, {
					e,
					msg,
					bridge,
					bridges,
					thisbridge,
				})
			);
		}
	);
}
