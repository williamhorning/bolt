import { MongoClient, RedisClient } from '../../deps.ts';
import { get_migrations, mongo_to_redis, versions } from '../migrations.ts';

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

const mongo = confirm(`are you migrating from a mongo database?`);

let data: [string, unknown][];

if (mongo) {
	const mongo_str = prompt('what is your mongo connection string?');
	const mongo_db = prompt('what is your mongo database?');
	const mongo_collection = prompt('what is your mongo collection?');

	if (!mongo_str || !mongo_db || !mongo_collection) Deno.exit();

	const client = new MongoClient();

	await client.connect(mongo_str);

	console.log(`connected to mongo!`);
	console.log(`downloading data from mongo...`);

	const collection = client.database(mongo_db).collection(mongo_collection);

	const final_data = (
		await collection.find({ _id: { $regex: '.*' } }).toArray()
	).map((i) => [i._id, i]) as [string, unknown][];

	console.log(`downloaded data from mongo!`);
	console.log(`applying migrations...`);

	data = mongo_to_redis(final_data) as [string, unknown][];
} else {
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
		try {
			redis_data.push([
				key,
				JSON.parse((await redis.sendCommand(['GET', key])) as string),
			]);
		} catch {
			console.log(`skipping ${key} due to invalid JSON...`);
			continue;
		}
	}

	console.log(`downloaded data from redis!`);
	console.log(`applying migrations...`);

	data = migrations.reduce((r, m) => m.translate(r), redis_data);
}

const final_data = data.map(([key, value]) => {
	return [key, JSON.stringify(value)];
});

console.log(`migrated your data!`);

const file = await Deno.makeTempFile();

await Deno.writeTextFile(file, JSON.stringify(final_data));

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
