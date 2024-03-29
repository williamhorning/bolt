import type { lightning } from '../../lightning.ts';
import type { bridge_platform, deleted_message, message } from '../types.ts';
import { log_error } from '../utils.ts';
import type { bridges } from './mod.ts';

export async function handle_message(
	bridges: bridges,
	l: lightning,
	msg: message<unknown> | deleted_message<unknown>,
	action: 'create_message' | 'edit_message' | 'delete_message'
) {
	const bridge = await bridges.get_bridge(msg);
	if (!bridge) return;

	if (
		action !== 'create_message' &&
		bridge.settings?.editing_allowed !== true
	) {
		return;
	}

	const platforms =
		action === 'create_message'
			? bridge.platforms.filter(i => i.channel !== msg.channel)
			: await bridges.get_bridge_message(msg.id);

	if (!platforms || platforms.length < 1) return;

	const data = [];

	for (const p of platforms) {
		const plugin = l.plugins.get(p.plugin);

		if (!plugin || !plugin[action]) {
			await log_error(new Error(`plugin ${p.plugin} has no ${action}`));
			continue;
		}

		if (!p.senddata || (action !== 'create_message' && !p.id)) continue;

		let d;

		try {
			d = await plugin[action](
				{
					...msg,
					replytoid: await get_replytoid(bridges, msg, p)
				} as message<unknown>,
				p as bridge_platform & { id: string }
			);
		} catch (e) {
			if (action === 'delete_message') continue;
			const err = await log_error(e, { p, action });
			try {
				d = await plugin[action](
					err.message,
					p as bridge_platform & { id: string }
				);
			} catch (e) {
				await log_error(
					new Error(`logging failed for ${err.uuid}`, { cause: e })
				);
				continue;
			}
		}
		sessionStorage.setItem(d.id!, 'true');
		data.push(d as bridge_platform & { id: string });
	}

	for (const i of data) {
		await l.redis.sendCommand([
			'JSON.SET',
			`lightning-bridge-${i.id}`,
			'$',
			JSON.stringify(data)
		]);
	}

	await l.redis.sendCommand([
		'JSON.SET',
		`lightning-bridge-${msg.id}`,
		'$',
		JSON.stringify(data)
	]);
}

async function get_replytoid(
	b: bridges,
	m: message<unknown> | deleted_message<unknown>,
	p: bridge_platform
) {
	if ('replytoid' in m && m.replytoid) {
		try {
			return (await b.get_bridge_message(m.replytoid))?.find(
				i => i.channel === p.channel && i.plugin === p.plugin
			)?.id;
		} catch {
			return undefined;
		}
	}

	return undefined;
}
