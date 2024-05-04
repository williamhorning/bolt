import { versions } from './types.ts';

type doc = [string, unknown][];

type fivedoc = [
	string,
	{
		_id: string;
		platforms: { plugin: string; channel: string; senddata: unknown }[];
		settings: { realnames?: boolean; editing_allowed?: boolean };
	}
][];

export const fivesevenbridges = {
	from: versions.Five,
	to: versions.Seven,
	from_db: 'bridges',
	from_type: 'mongo' as const,
	to_type: 'redis' as const,
	translate: (items: doc | fivedoc) =>
		(items as fivedoc).map(([id, val]) => {
			return [
				id,
				{
					allow_editing: val.settings.editing_allowed ?? false,
					channels: val.platforms.map(i => {
						return {
							id: i.channel,
							data: i.senddata,
							plugin: i.plugin
						};
					}),
					id,
					use_rawname: val.settings.realnames ?? false
				}
			];
		}) as doc
};
