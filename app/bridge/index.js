import { getBridge } from "./utils.js";
import * as bridge from './bridge.js';

export async function tryBridgeSend(msg) {
	let dat = await getBridge(msg);
	if (dat?._id) {
    await bridge.send(msg, dat);
  }
}

export async function tryBridgeEdit(msg) {
	let dat = await getBridge(msg);
	if (dat?._id) {
		await bridge.edit(msg, dat);
	}
}

export async function tryBridgeDelete(msg) {
	let dat = await getBridge(msg);
	if (dat?._id) {
		await bridge.delet(msg, dat);
	}
}

export * from "./utils.js";