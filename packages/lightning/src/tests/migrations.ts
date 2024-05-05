import { assertEquals } from '../../deps.ts';
import { fivesevenredis } from '../migrations.ts';
import { versions } from '../types.ts';
import { apply_migrations, get_migrations } from '../utils.ts';

Deno.test('get a migration', () => {
	const migrations = get_migrations(versions.Five, versions.Seven);
	assertEquals(migrations, [fivesevenredis]);
})

Deno.test('apply migrations', () => {
	const result = apply_migrations([fivesevenredis], migrations_five);

	assertEquals(result, migrations_seven as [string, unknown][]);
})

const migrations_five = [
	[
		'lightning-bridge-1',
		[
			{
				plugin: 'bolt-discord',
				channel: '000000000000000000',
				senddata: { id: '1', token: '2' },
				id: '1'
			},
			{
				plugin: 'bolt-guilded',
				channel: '6cb2f623-8eee-44a3-b5bf-cf9b147e46d7',
				senddata: { id: '1', token: '2' },
				id: '2'
			}
		]
	]
] as [string, unknown][];

const migrations_seven = [
	[
		'lightning-bridged-1',
		{
			allow_editing: true,
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
			id: 'oldeditsupport-1',
			messages: ['1', '2'],
			use_rawname: false
		}
	]
];
