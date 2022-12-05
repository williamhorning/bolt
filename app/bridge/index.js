import legacySend from "./legacyBridgeSend.js";
import { getBridges } from "./utils.js";
import * as bridge from './bridge.js';

async function typeandid(msg) {
	let { legacy: legacyID, current: currentID } = await getBridges(msg);
	if (!legacyID && !currentID) return { type: "none", id: null };
	return {
		type: legacyID ? "legacy" : "current",
		data: legacyID ? legacyID : currentID,
	};
}

export async function tryBridgeSend(msg) {
	let dat = await typeandid(msg);
	if (dat.type == "legacy") {
		legacySend(msg, dat.data);
	} else if (dat.type == "current") {
		await bridge.send(msg, dat.data);
	}
}

export async function tryBridgeEdit(msg) {
	let dat = await typeandid(msg);
	if (dat.type == "current") {
		await bridge.edit(msg, dat.data);
	}
}

export async function tryBridgeDelete(msg) {
	let dat = await typeandid(msg);
	if (dat.type == "current") {
		await bridge.delet(msg, dat.data);
	}
}
