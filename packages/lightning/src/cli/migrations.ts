import { MongoClient, RedisClient, tempfile } from '../../deps.ts';
import { convert_five_to_seven_redis } from '../migrations.ts';
import { versions } from '../types.ts';
import { apply_migrations, get_migrations } from '../utils.ts';
import { writeFile } from "node:fs/promises";

export async function migrations() {
	const redis_hostname = prompt(
		`what hostname is used by your redis instance?`,
		'localhost'
	);
	const redis_port = prompt(
		`what port is used by your redis instance?`,
		'6379'
	);
	const mongo = confirm(`are you migrating from a mongo database?`);

	if (!redis_hostname || !redis_port) return;

	const redis = new RedisClient(
		// TODO: make this work
		await Deno.connect({
			hostname: redis_hostname,
			port: Number(redis_port)
		})
	);

	console.log('connected to redis!');

	let data: [string, unknown][];

	if (mongo) {
		const mongo_str = prompt('what is your mongo connection string?');
		const mongo_db = prompt('what is your mongo database?');
		const mongo_collection = prompt('what is your mongo collection?');

		if (!mongo_str || !mongo_db || !mongo_collection) return;

		const client = new MongoClient();

		await client.connect(mongo_str);

		const collection = client.database(mongo_db).collection(mongo_collection);

		console.log(`connected to mongo!`);
		console.log(`downloading data from mongo...`);

		const mongo_data = (await collection.find({}).toArray()).map(i => [
			i._id,
			i
		]) as [string, unknown][];

		console.log(`downloaded data from mongo!`);
		console.log(`applying migrations...`);

		data = convert_five_to_seven_redis(mongo_data);
	} else {
		console.log(`available versions: ${Object.values(versions).join(', ')}`);

		const from_version = prompt('what version are you migrating from?') as
			| versions
			| undefined;
		const to_version = prompt('what version are you migrating to?') as
			| versions
			| undefined;

		if (!from_version || !to_version) return;

		const migrations = get_migrations(from_version, to_version);

		if (migrations.length < 1) return;

		console.log(`downloading data from redis...`);

		const keys = (await redis.sendCommand(['KEYS', '*'])) as string[];
		const redis_data = [] as [string, unknown][];

		// this is bad for the database, sorry database :(

		for (const key of keys) {
			try {
				redis_data.push([
					key,
					JSON.parse((await redis.sendCommand(['GET', key])) as string)
				]);
			} catch {
				console.log(`skipping ${key} due to invalid JSON...`);
				continue;
			}
		}

		console.log(`downloaded data from redis!`);
		console.log(`applying migrations...`);

		data = apply_migrations(migrations, redis_data);
	}

	const final_data = data.map(([key, value]) => {
		return [key, JSON.stringify(value)];
	});

	console.log(`migrated your data!`);

	const file = await tempfile()

	await writeFile(file, JSON.stringify(final_data));

	const write = confirm(
		`do you want the data in ${file} to be written to the database?`
	);

	if (!write) return;

	const cmd = ['MSET', ...final_data.flat()];

	const reply = await redis.sendCommand(cmd);

	if (reply === 'OK') {
		console.log('data written to database');
	} else {
		console.log('error writing data to database', reply);
	}
}
