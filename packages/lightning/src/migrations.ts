/**
 * get migrations that can then be applied using apply_migrations
 * @param from the version that the data is currently in
 * @param to the version that the data will be migrated to
 */
export function get_migrations(from: versions, to: versions): migration[] {
	return migrations.slice(
		migrations.findIndex((i) => i.from === from),
		migrations.findLastIndex((i) => i.to === to) + 1,
	);
}

/**
 * convert a mognodb document from 0.5 to redis for 0.7
 * @param items the mongodb documents
 */
export function mongo_to_redis(
	items: [string, unknown][],
): [string, unknown][] {
	return items.flatMap(([id, v]) => {
		const val = v as {
			_id: string;
			platforms: { plugin: string; channel: string; senddata: unknown }[];
			settings: { realnames?: boolean; editing_allowed?: boolean };
		};
		return [[`lightning-bridge-${id}`, {
			allow_editing: val.settings?.editing_allowed ?? false,
			channels: val.platforms.map((i) => {
				return {
					id: i.channel,
					data: i.senddata,
					plugin: i.plugin,
				};
			}),
			id,
			use_rawname: val.settings?.realnames ?? false,
		}], ...val.platforms.map((i) => [`lightning-bchannel-${i.channel}`, id])];
	}) as [string, unknown][];
}

/** the type of a migration */
export interface migration {
	/** the version to translate from */
	from: versions;
	/** the version to translate to */
	to: versions;
	/** a function to translate a document */
	translate: (data: [string, unknown][]) => [string, unknown][];
}

/** all of the versions with migrations to/from them */
export enum versions {
	/** versions 0.5 through 0.6 */
	Five = '0.5',
	/** versions 0.7 and above*/
	Seven = '0.7',
}

/** the internal list of migrations */
const migrations = [
	{
		from: versions.Five,
		to: versions.Seven,
		translate: (items) =>
			items.flatMap(([key, val]) => {
				if (!key.startsWith('lightning-bridge-')) return [];

				const [_, _2, ...ids] = key.split('-');
				const id = `lightning-bridged-${ids.join('-')}`;
				const channels = (
					val as {
						plugin: string;
						channel: string;
						senddata: unknown;
						id: string;
					}[]
				).map((i) => {
					return { id: i.channel, data: i.senddata, plugin: i.plugin };
				});
				const value = {
					allow_editing: true,
					channels,
					id,
					messages: val,
					use_rawname: false,
				};

				return [[id, value]];
			}),
	},
] as migration[];
