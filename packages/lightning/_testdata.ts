export const cmd_help_output = {
	author: {
		username: 'Bolt',
		profile:
			'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
		rawname: 'lightning',
		id: 'lightning'
	},
	content: 'check out [the docs](https://williamhorning.dev/bolt/) for help.',
	channel: '',
	id: '',
	reply: async () => {},
	timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
	platform: {
		name: 'lightning',
		message: undefined
	}
};

export const migrations_four_one = [
	{
		_id: 'discord-bridge-a',
		value: { id: '1', token: '2' }
	},
	{
		_id: 'discord-000000000000000000',
		value: 'bridge-a'
	}
];

export const migrations_four_two = [
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

export const migrations_fourbeta = [
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

export const migrations_five = [
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

export const utils_msg = {
	author: {
		username: 'Bolt',
		profile:
			'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
		rawname: 'lightning',
		id: 'lightning'
	},
	content: 'test',
	channel: '',
	id: '',
	reply: async () => {},
	timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
	platform: {
		name: 'lightning',
		message: undefined
	}
};

export const utils_cfg = {
	plugins: [],
	mongo_uri: 'mongodb://localhost:27017',
	mongo_database: 'lightning',
	redis_host: 'localhost',
	redis_port: 6379
};

export const utils_err = new Error('test');

export const utils_extra = { test: 'test' };

export const utils_err_id = () => 'test';

export const utils_err_return = {
	e: utils_err,
	uuid: 'test',
	extra: { test: 'test' },
	message: {
		author: {
			username: 'Bolt',
			profile:
				'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
			rawname: 'lightning',
			id: 'lightning'
		},
		content:
			'Something went wrong! [Look here](https://williamhorning.dev/bolt) for help.\n```\ntest\ntest\n```',
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
		platform: {
			name: 'lightning',
			message: undefined
		}
	}
};

export const utils_err_hook = {
	embeds: [
		{
			title: utils_err.message,
			description: `\`\`\`js\n${utils_err.stack}\n${JSON.stringify(
				{
					...utils_extra,
					uuid: 'test'
				},
				null,
				2
			)}\`\`\``
		}
	]
};
