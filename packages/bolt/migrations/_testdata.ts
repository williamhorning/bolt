export const four_one_platform = [
	{
		_id: 'discord-bridge-a',
		value: { id: '1', token: '2' }
	},
	{
		_id: 'discord-000000000000000000',
		value: 'bridge-a'
	}
];

export const four_two_platform = [
	{
		_id: 'discord-bridge-a',
		value: { id: '1', token: '2' }
	},
	{
		_id: 'discord-000000000000000000',
		value: 'bridge-a'
	},
	{
		_id: 'guilded-bridge-a',
		value: { id: '1', token: '2' }
	},
	{
		_id: 'guilded-6cb2f623-8eee-44a3-b5bf-cf9b147e46d7',
		value: 'bridge-a'
	}
];

export const fourbeta = [
	{
		_id: 'bridge-a',
		value: {
			bridges: [
				{
					platform: 'discord',
					channel: '000000000000000000',
					senddata: { id: '1', token: '2' }
				},
				{
					platform: 'guilded',
					channel: '6cb2f623-8eee-44a3-b5bf-cf9b147e46d7',
					senddata: { id: '1', token: '2' }
				}
			]
		}
	}
];

export const five = [
	{
		_id: 'bridge-a',
		platforms: [
			{
				plugin: 'bolt-discord',
				channel: '000000000000000000',
				senddata: { id: '1', token: '2' }
			},
			{
				plugin: 'bolt-guilded',
				channel: '6cb2f623-8eee-44a3-b5bf-cf9b147e46d7',
				senddata: { id: '1', token: '2' }
			}
		]
	}
];
