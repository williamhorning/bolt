import { Document } from './_deps.ts';
import { _map_plugins } from './mod.ts';

export default {
	from: '0.4-beta',
	to: '0.5',
	from_db: 'bridgev1',
	to_db: 'bridges',
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
					platforms: value.bridges.map(
						(i: { platform: string; channel: string; senddata: unknown }) => {
							return {
								plugin: _map_plugins(i.platform),
								channel: i.channel,
								senddata: i.senddata
							};
						}
					)
				}
			];
		})
};
