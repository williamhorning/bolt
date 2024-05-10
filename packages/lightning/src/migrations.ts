import { versions, type bridge_document, type migration } from './types.ts';

type doc = [string, unknown][];

type fivedoc = [
	string,
	{
		_id: string;
		platforms: { plugin: string; channel: string; senddata: unknown }[];
		settings: { realnames?: boolean; editing_allowed?: boolean };
	}
][];

type fivedocredis = [
	string,
	{ plugin: string; channel: string; senddata: unknown; id: string }[]
][];

export function conv_mongo_to_redis(items: doc | fivedoc) {
	return (items as fivedoc).map(([id, val]) => {
		return [
			id,
			{
				allow_editing: val.settings?.editing_allowed ?? false,
				channels: val.platforms.map(i => {
					return {
						id: i.channel,
						data: i.senddata,
						plugin: i.plugin
					};
				}),
				id,
				use_rawname: val.settings?.realnames ?? false
			}
		];
	}) as doc;
}

export const migrations = [
	{
		from: versions.Five,
		to: versions.Seven,
		translate: (items: doc | fivedocredis) =>
			(items as fivedocredis).flatMap(([id, val]) => {
				if (id.startsWith('lightning-bridge-')) {
					const [_, _2, msg_id] = id.split('-');
					return [
						[
							`lightning-bridged-${msg_id}`,
							{
								allow_editing: true,
								channels: val.map(i => {
									return { id: i.channel, data: i.senddata, plugin: i.plugin };
								}),
								id: `oldeditsupport-${msg_id}`,
								messages: val.map(i => {
									return {
										channel: i.channel,
										id: i.id,
										plugin: i.plugin
									};
								}),
								use_rawname: false
							} as bridge_document
						]
					];
				}
				return [];
			}) as doc
	}
] as migration[];
