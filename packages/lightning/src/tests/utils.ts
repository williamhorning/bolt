import { assertEquals, test } from '../../deps.ts';
import { create_message, define_config } from '../utils.ts';

const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

globalThis.Temporal.Now.instant = () => {
	return temporal_instant;
};

console.log = console.error = () => {};

test('config handling', () => {
	assertEquals(define_config(), cfg);
});

test('message creation', () => {
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
	platform: {
		name: 'lightning',
		message: undefined
	}
};

const cfg = {
	plugins: [],
	commands: [],
	redis_host: 'localhost',
	redis_port: 6379
};
