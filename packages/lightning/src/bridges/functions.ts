import type { lightning } from '../lightning.ts';
import type { bridge_document } from '../types.ts';

export async function exists(l: lightning, key: string) {
	return Boolean(await l.redis.sendCommand(['EXISTS', key]));
}

export async function get_json<T = unknown>(
	l: lightning,
	key: string
): Promise<T | undefined> {
	const reply = await l.redis.sendCommand(['GET', key]);
	if (!reply || reply === 'OK') return;
	return JSON.parse(reply as string) as T;
}

export async function del_key(l: lightning, key: string) {
	await l.redis.sendCommand(['DEL', key]);
}

export async function set_json(l: lightning, key: string, value: unknown) {
	await l.redis.sendCommand(['SET', key, JSON.stringify(value)]);
}

export async function get_bridge(l: lightning, id: string) {
	return await get_json<bridge_document>(l, `lightning-bridge-${id}`);
}

export async function get_channel_bridge(l: lightning, id: string) {
	const ch = await l.redis.sendCommand(['GET', `lightning-bchannel-${id}`]);
	return await get_bridge(l, ch as string);
}

export async function get_message_bridge(l: lightning, id: string) {
	return await get_json<bridge_document>(l, `lightning-bridged-${id}`);
}

export async function set_bridge(l: lightning, bridge: bridge_document) {
	set_json(l, `lightning-bridge-${bridge.id}`, bridge);

	for (const channel of bridge.channels) {
		await l.redis.sendCommand([
			'SET',
			`lightning-bchannel-${channel.id}`,
			bridge.id
		]);
	}
}
