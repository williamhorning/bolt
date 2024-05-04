export const migrations_five = [
	[
		'bridge-a',
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
	]
] as [string, unknown][];

export const migrations_seven = [
	[
		'bridge-a',
		{
			allow_editing: false,
			channels: [
				{
					id: '000000000000000000',
					data: { id: '1', token: '2' },
					plugin: 'bolt-discord'
				},
				{
					id: '6cb2f623-8eee-44a3-b5bf-cf9b147e46d7',
					data: { id: '1', token: '2' },
					plugin: 'bolt-guilded'
				}
			],
			id: 'bridge-a',
			use_rawname: false
		}
	]
]

export const utils_msg = {
	author: {
		username: 'lightning',
		profile: 'https://williamhorning.dev/assets/lightning.png',
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
	commands: [],
	redis_host: 'localhost',
	redis_port: 6379
};

export const utils_err = new Error('test');

export const utils_extra = { test: 'test' };

export const utils_err_id = () => 'test';

export const utils_err_return = {
	e: utils_err,
	cause: utils_err.cause,
	uuid: 'test',
	extra: { test: 'test' },
	message: {
		author: {
			username: 'lightning',
			profile: 'https://williamhorning.dev/assets/lightning.png',
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
			description: utils_err_return.uuid
		}
	]
};
