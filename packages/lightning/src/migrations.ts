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
	/** versions 0.7 through 0.7.2 */
	Seven = '0.7',
	/** versions 0.7.3 and higher */
	SevenDotThree = '0.7.3',
}

/** the internal list of migrations */
const migrations = [
	{
		from: versions.Seven,
		to: versions.SevenDotThree,
		translate: (items) =>
			items.map(([key, val]) => {
				if (!key.startsWith('lightning-bridge')) return [key, val];

				return [
					key,
					{
						...(val as Record<string, unknown>),
						channels: (val as {
							channels: {
								id: string;
								data: unknown;
								plugin: string;
							}[];
						}).channels.map((i) => {
							return {
								data: i.data,
								disabled: false,
								id: i.id,
								plugin: i.plugin,
							};
						}),
						messages: (val as {
							messages: {
								id: string | string[];
								channel: string;
								plugin: string;
							}[];
						}).messages?.map((i) => {
							if (typeof i.id === 'string') {
								return {
									...i,
									id: [i.id],
								};
							}
							return i;
						}),
					},
				];
			}),
	},
] as migration[];
