import { Document } from './deps.ts';
import { mapPlugins } from './utils.ts';

export default {
	versionfrom: '0.4-beta',
	versionto: '0.5',
	collectionNames: {
		fromDB: 'bridgev1',
		toDB: 'bridges'
	},
	translate: (
		itemslist: (
			| Document
			| {
					_id: string;
					value: {
						bridges: { platform: string; channel: string; senddata: unknown }[];
					};
			  }
		)[]
	) =>
		itemslist.flatMap(({ _id, value }) => {
			if (_id.startsWith('message-')) return [];
			return [
				{
					_id,
					name: `bridge-migrated-${_id}`,
					platforms: value.bridges.map(
						(i: { platform: string; channel: string; senddata: unknown }) => {
							return {
								plugin: mapPlugins(i.platform),
								channel: i.channel,
								senddata: i.senddata,
								name: `${i.channel} on ${i.platform}`
							};
						}
					)
				}
			];
		})
};
