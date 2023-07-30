import { Document } from './deps.ts';
import { isChannel } from './utils.ts';

export default {
	versionfrom: '0.4',
	versionto: '0.4-beta',
	collectionNames: {
		fromDB: 'bridge',
		toDB: 'bridgev1'
	},
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
			if (isChannel(name)) continue;
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
			if (isChannel(_id)) continue;
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
