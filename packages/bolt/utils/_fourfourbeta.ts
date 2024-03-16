import { Document } from 'mongo';

export default {
	from: '0.4',
	to: '0.4-beta',
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
			const _id = items.find(i => {
				return i._id.startsWith(platform) && i.value === name;
			})?._id;
			if (!_id) continue;
			if (!obj[name]) obj[name] = [];
			obj[name].push({
				platform,
				channel: _id.split('-').slice(1).join('-'),
				senddata: item.value
			});
		}

		const documents = [];

		for (const _id in obj) {
			const value = obj[_id];
			if (!value) continue;
			if (is_channel(_id)) continue;
			if (value.length < 2) continue;
			documents.push({
				_id,
				value: {
					bridges: value
				}
			});
		}

		return documents;
	}
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
