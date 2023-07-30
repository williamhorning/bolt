import {
	BoltMigrationVersions,
	applyBoltMigrations,
	getBoltMigrations
} from '../migrations/mod.ts';
import { Input, MongoClient, Select, Toggle, colors, prompt } from './deps.ts';

export default async function migrations() {
	const sharedversionprompt = {
		type: Select,
		options: Object.values(BoltMigrationVersions)
	};
	const promptdata = await prompt([
		{
			name: 'from',
			message: 'what version of bolt is the DB currently set up for?',
			...sharedversionprompt
		},
		{
			name: 'to',
			message: 'what version of bolt do you want to move to?',
			...sharedversionprompt
		},
		{
			name: 'mongo',
			type: Input,
			message: 'Input your MongoDB connection URI',
			default: 'mongodb://localhost:27017'
		},
		{
			name: 'prod',
			type: Toggle,
			message: 'Did you run Bolt in prod mode?',
			default: false
		}
	]);

	if (!promptdata.from || !promptdata.to || !promptdata.mongo) Deno.exit();

	const migrationlist = getBoltMigrations(promptdata.from, promptdata.to);

	if (migrationlist.length < 1) Deno.exit();

	const mongo = new MongoClient();
	await mongo.connect(promptdata.mongo);
	const database = mongo.database(promptdata.prod ? 'bolt' : 'bolt-canary');

	console.log(colors.blue(`Downloading your data...`));

	const dumped = await database
		.collection(migrationlist[0].collectionNames.fromDB)
		.find()
		.toArray();

	console.log(
		colors.blue(`Downloaded data from the DB! Migrating your data...`)
	);

	const data = applyBoltMigrations(migrationlist, dumped);

	const filepath = Deno.makeTempFileSync({ suffix: 'bolt-db-migration' });
	Deno.writeTextFileSync(filepath, JSON.stringify(data));

	const writeconfirm = await Toggle.prompt({
		message: `Do you want to write the data at ${filepath} to the DB?`
	});

	if (!writeconfirm) Deno.exit();

	const tocollection = database.collection(
		migrationlist.slice(-1)[0].collectionNames.toDB
	);

	await Promise.all(
		data.map(i => {
			return tocollection.replaceOne({ _id: i._id }, i, { upsert: true });
		})
	);

	console.log(colors.green('Wrote data to the DB'));
}
