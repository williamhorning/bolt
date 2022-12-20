import legacySend from "./legacyBridgeSend.js";
import { typeandid } from "./utils.js";
import * as bridge from './bridge.js';

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

export * from "./utils.js";