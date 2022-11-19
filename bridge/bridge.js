import { boltError, platforms, bridgeDatabase } from "../utils.js";

function wrapFunc(msg, bridgeid, func, errorfunc) {
	let bridges = thisbridge.bridges.filter((i) => {
		return !(i.platform == msg.platform && i.channel == msg.channel);
	});
	let results = [];
	for (let bridge of bridges) {
		results.push(async () => {
			try {
				await func(msg, bridge, bridges);
			} catch (e) {
				errorfunc(e, msg, bridgeid, bridge, bridges);
			}
		});
	}
}

export async function send(msg, thisbridge) {
	let sentmsgs = wrapFunc(
		msg,
		thisbridge,
		async (msg, bridge) => {
			return await platforms[bridge.platform].bridgeSend(msg, bridge.sendData);
		},
		async (e, msg, bridge, bridges) => {
			return await platforms[msg.platform].bridgeSend(
				boltError(`message via bridge to ${i.platform}`, e, {
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
