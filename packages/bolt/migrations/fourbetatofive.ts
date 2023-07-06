import { Document } from './deps.ts';

function mapPlugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}

export default {
	versionfrom: '0.4-beta',
	versionto: '0.5',
	collectionNames: {
		fromDB: 'bridgev1',
		toDB: 'bridges'
	},
	// deno-lint-ignore require-await
	translate: async (
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
								name: _id
							};
						}
					)
				}
			];
		})
};
