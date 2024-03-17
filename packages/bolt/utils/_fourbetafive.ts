import { Document } from 'mongo';

type doc = {
	_id: string;
	value: {
		bridges: { platform: string; channel: string; senddata: unknown }[];
	};
};

export default {
	from: '0.4-beta',
	to: '0.5',
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

function map_plugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}
