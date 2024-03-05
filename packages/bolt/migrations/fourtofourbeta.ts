import { Document } from './_deps.ts';
import { _is_channel } from './mod.ts';

export default {
	from: '0.4',
	to: '0.4-beta',
	from_db: 'bridge',
	to_db: 'bridgev1',
	translate: (
		items: (Document | { _id: string; value: string | unknown })[]
	) => {
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
			if (_is_channel(name)) continue;
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
			if (_is_channel(_id)) continue;
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
