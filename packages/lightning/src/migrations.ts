import type { Document } from 'mongo';
import type { versions } from './types.ts';

type doc = {
	_id: string;
	value: {
		bridges: { platform: string; channel: string; senddata: unknown }[];
	};
};

function is_channel(channel: string): boolean {
	if (
		channel.match(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		)
	) {
		return true;
	}
	if (channel.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/gm)) return true;
	if (!isNaN(Number(channel))) return true;
	if (
		channel.startsWith('discord-') ||
		channel.startsWith('guilded-') ||
		channel.startsWith('revolt-')
	) {
		return true;
	}
	return false;
}

function map_plugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}

export const fourbetafive = {
	from: '0.4-beta' as versions,
	to: '0.5' as versions,
	from_db: 'bridgev1',
	to_db: 'bridges',
	translate: (itemslist: (doc | Document)[]) =>
		(itemslist as doc[]).flatMap(({ _id, value }) => {
			if (_id.startsWith('message-')) return [];
			return [
				{
					_id,
					platforms: value.bridges.map(({ platform, channel, senddata }) => ({
						plugin: map_plugins(platform),
						channel,
						senddata
					}))
				}
			];
		}) as Document[]
};

export const fourfourbeta = {
	from: '0.4' as versions,
	to: '0.4-beta' as versions,
	from_db: 'bridge',
	to_db: 'bridgev1',
	translate: (
		items: (Document | { _id: string; value: string | unknown })[]
	): Document[] => {
		const obj = {} as {
			[key: string]: {
				platform: string;
				channel: string;
				senddata: unknown;
			}[];
		};

		for (const item of items) {
			const [platform, ...join] = item._id.split('-');
			const name = join.join('-');
			if (is_channel(name)) continue;
			const _id = items.find(
				i => i._id.startsWith(platform) && i.value === name
			)?._id;
			if (!_id) continue;
			if (!obj[name]) obj[name] = [];
			obj[name].push({
				platform,
				channel: _id.split('-').slice(1).join('-'),
				senddata: item.value
			});
		}

		return Object.entries(obj)
			.filter(([key, value]) => !is_channel(key) && value.length >= 2)
			.map(([key, value]) => ({
				_id: key,
				value: { bridges: value }
			}));
	}
};
