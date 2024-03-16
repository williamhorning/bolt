import { Document } from 'mongo';

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
		itemslist.flatMap<{
			_id: string;
			platforms: { plugin: string; channel: string; senddata: unknown }[];
		}>(({ _id, value }) => {
			if (_id.startsWith('message-')) return [];
			return [
				{
					_id,
					platforms: value.bridges.map(
						(i: { platform: string; channel: string; senddata: unknown }) => {
							return {
								plugin: map_plugins(i.platform),
								channel: i.channel,
								senddata: i.senddata
							};
						}
					)
				}
			];
		}) as Document[]
};

function map_plugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}
