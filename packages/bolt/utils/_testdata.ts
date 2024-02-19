export const msg = {
	author: {
		username: 'Bolt',
		profile:
			'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
		rawname: 'bolt',
		id: 'bolt'
	},
	content: 'test',
	embeds: [{ description: 'test' }],
	channel: '',
	id: '',
	reply: async () => {},
	timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
	platform: {
		name: 'bolt',
		message: undefined
	},
	uuid: 'test'
};

export const cfg = {
	prod: false,
	plugins: [],
	database: {
		mongo: {
			connection: 'mongodb://localhost:27017',
			database: 'bolt-testing'
		},
		redis: { hostname: 'localhost' }
	},
	http: {}
};

export const err = new Error('test');

export const extra = { test: 'test' };

export const err_id = () => 'test';

export const err_return = {
	e: err,
	uuid: 'test',
	extra: { test: 'test' },
	message: {
		author: {
			username: 'Bolt',
			profile:
				'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
			rawname: 'bolt',
			id: 'bolt'
		},
		content: `Something went wrong!\nCheck [the docs](https://williamhorning.dev/bolt/docs/Using/) for help.\n\`\`\`test\ntest\`\`\``,
		channel: '',
		embeds: undefined,
		id: '',
		reply: async () => {},
		timestamp: Temporal.Instant.from('2021-01-01T00:00:00Z'),
		platform: {
			name: 'bolt',
			message: undefined
		},
		uuid: 'test'
	}
};

export const err_hook = {
	embeds: [
		{
			title: err.message,
			description: `\`\`\`${err.stack}\`\`\`\n\`\`\`js\n${JSON.stringify({
				...extra,
				uuid: 'test'
			})}\`\`\``
		}
	]
};
