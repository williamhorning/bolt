import { boltError } from "../utils.js";

export async function bridgeSend(msg, platforms, bridgeDatabase, thisbridge) {
	let bridges = thisbridge.bridges.filter((i) => {
		return !(i.platform == msg.platform && i.channel == msg.channel);
	});
	let sentmsgs = [];
	for (let i in bridges) {
		let bridge = bridges[i];
		sentmsgs.push(
			await (async () => {
				try {
					return await platforms[msg.platform].bridgeSend(msg, bridge.senddata);
				} catch (e) {
					return await platforms[msg.platform].bridgeSend(
						boltError(`message via bridge to ${platform}`, e, {
							msg,
							thisbridge,
							bridges,
						}),
						bridge.senddata
					);
				}
			})()
		);
	}
	bridgeDatabase.put(`message-${msg.id}`, {
		message: {
			platform: msg.platform,
			channel: msg.channel,
			message: msg.id,
		},
		sent_to: sentmsgs,
	});
}
