import type { versions } from './types.ts';

type doc = [string, unknown][];

type fourbetadoc = [
	string,
	{
		_id: string;
		value: {
			bridges: { platform: string; channel: string; senddata: unknown }[];
		};
	}
][];

export const fourbetafive = {
	from: '0.4-beta' as versions,
	to: '0.5' as versions,
	from_db: 'bridgev1',
	to_db: 'bridges',
	from_type: 'mongo' as const,
	to_type: 'mongo' as const,
	translate: (itemslist: doc | fourbetadoc) =>
		(itemslist as fourbetadoc)
			.filter(([_id]) => !_id.startsWith('message-'))
			.map(([_id, { value }]) => {
				return [
					_id,
					{
						_id,
						platforms: value.bridges.map(({ platform, channel, senddata }) => ({
							plugin: `bolt-${platform}`,
							channel,
							senddata
						}))
					}
				];
			}) as doc
};
