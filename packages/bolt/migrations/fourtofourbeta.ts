import { Document } from './deps.ts';

export default {
	versionfrom: '0.4',
	versionto: '0.4-beta',
	collectionNames: {
		fromDB: 'bridge',
		toDB: 'bridgev1'
	},
	translate: async (
		items: (Document | { _id: string; value: string | unknown })[]
	) => {
		const obj = {} as {
			[key: string]: {
				platform: string;
				channel: string;
				senddata: unknown;
			}[];
		};

		for (const item of items) {
			const [platform, ...join] = item._id.split('-');
			const name = join.join('-');
			if (await isChannel(platform as 'discord' | 'guilded' | 'revolt', name))
				continue;
			const _id = items.find(i => {
				return i._id.startsWith(platform) && i.value === name;
			})?._id;
			if (!_id) continue;
			if (!obj[name]) obj[name] = [];
			obj[name].push({
				platform,
				channel: _id.split('-').slice(1).join('-'),
				senddata: item.value
			});
		}

		const documents = [];

		for (const [_id, value] of Object.entries(obj)) {
			if (value.length < 2) continue;
			documents.push({
				_id,
				value: {
					bridges: value
				}
			});
		}

		return documents;
	}
};

const platforms = {
	discord: {
		url: `https://discord.com/api/v10/channels/`,
		headers: {
			Authorization: `Bot ${Deno.env.get('DISCORD_TOKEN')}`
		}
	},
	guilded: {
		url: `https://www.guilded.gg/api/v1/channels/`,
		headers: {
			Authorization: `Bearer ${Deno.env.get('GUILDED_TOKEN')}`
		}
	},
	revolt: {
		url: `https://api.revolt.chat/channels/`,
		headers: {
			'x-session-token': Deno.env.get('REVOLT_TOKEN')
		}
	}
};

async function isChannel(platform: keyof typeof platforms, channel: string) {
	return (
		await fetch(`${platforms[platform].url}${channel}`, {
			headers: {
				'User-Agent': 'Bolt (williamhorning.dev, 0.4)',
				...platforms[platform].headers
			} as HeadersInit
		})
	).ok;
}
