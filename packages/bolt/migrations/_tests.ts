import { assertEquals } from 'https://deno.land/std@0.216.0/assert/mod.ts';
import {
	five,
	four_one_platform,
	fourbeta,
	four_two_platform
} from './_testdata.ts';
import fourbetatofive from './fourbetatofive.ts';
import fourtofourbeta from './fourtofourbeta.ts';

Deno.test('four to fourbeta one platform', () => {
	assertEquals(fourtofourbeta.translate(four_one_platform), []);
});

Deno.test('four to fourbeta two platforms', () => {
	assertEquals(fourtofourbeta.translate(four_two_platform), fourbeta);
});

Deno.test('fourbeta to five', () => {
	assertEquals(fourbetatofive.translate(fourbeta), five);
});
