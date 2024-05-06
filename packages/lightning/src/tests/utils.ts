import { assertEquals } from '../../deps.ts';
import { create_message, define_config } from '../utils.ts';

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = console.error = () => {};

Deno.test('config handling', () => {
	assertEquals(define_config(), cfg);
});

Deno.test('message creation', () => {
	const result = create_message('test');

	result.reply = msg.reply;

	assertEquals(result, msg);
});

const msg = {
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
	plugin: 'lightning'
};

const cfg = {
	plugins: [],
	redis_host: 'localhost',
	redis_port: 6379
};
