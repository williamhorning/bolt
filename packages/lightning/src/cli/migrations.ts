import { RedisClient } from '@iuioiua/r2d2';
import { get_migrations, versions } from '../migrations.ts';

const redis_hostname = prompt(
	`what hostname is used by your redis instance?`,
	'localhost',
);
const redis_port = prompt(`what port is used by your redis instance?`, '6379');

if (!redis_hostname || !redis_port) Deno.exit();

const redis = new RedisClient(
	await Deno.connect({
		hostname: redis_hostname,
		port: Number(redis_port),
	}),
);

console.log('connected to redis!');

console.log(`available versions: ${Object.values(versions).join(', ')}`);

const from_version = prompt('what version are you migrating from?') as
	| versions
	| undefined;
const to_version = prompt('what version are you migrating to?') as
	| versions
	| undefined;

if (!from_version || !to_version) Deno.exit();

const migrations = get_migrations(from_version, to_version);

if (migrations.length < 1) Deno.exit();

console.log(`downloading data from redis...`);

const keys = (await redis.sendCommand(['KEYS', '*'])) as string[];
const redis_data = [] as [string, unknown][];

// sorry database :(

for (const key of keys) {
	const val = await redis.sendCommand(['GET', key]);
	try {
		redis_data.push([
			key,
			JSON.parse(val as string),
		]);
	} catch {
		redis_data.push([
			key,
			val as string,
		]);
		continue;
	}
}

console.log(`downloaded data from redis!`);
console.log(`applying migrations...`);

const data = migrations.reduce((r, m) => m.translate(r), redis_data);

const final_data = data.map(([key, value]) => {
	return [key, typeof value !== 'string' ? JSON.stringify(value) : value];
});

console.log(`migrated your data!`);

const file = await Deno.makeTempFile();

await Deno.writeTextFile(file, JSON.stringify(final_data, null, 2));

const write = confirm(
	`do you want the data in ${file} to be written to the database?`,
);

if (!write) Deno.exit();

const cmd = ['MSET', ...final_data.flat()];

const reply = await redis.sendCommand(cmd);

if (reply === 'OK') {
	console.log('data written to database');
} else {
	console.log('error writing data to database', reply);
}
