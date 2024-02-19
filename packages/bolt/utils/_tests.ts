import { assertEquals } from 'https://deno.land/std@0.154.0/testing/asserts.ts';
import { create_message, define_config } from './mod.ts';
import { cfg, msg } from './_testdata.ts';

function overwrite_temporal() {
	const temporal_instant = Temporal.Instant.from('2021-01-01T00:00:00Z');

	globalThis.Temporal.Now.instant = () => {
		return temporal_instant;
	};
}

Deno.test('message creation', () => {
	overwrite_temporal();

	const msg_real = create_message({
		text: 'test',
		embeds: [{ description: 'test' }],
		uuid: 'test'
	});

	msg_real.reply = msg.reply;

	assertEquals(msg_real, msg);
});

Deno.test('config handling', () => {
	assertEquals(define_config(), cfg);
});
