import {
	versions,
	Input,
	MongoClient,
	Select,
	Toggle,
	apply_migrations,
	colors,
	get_migrations,
	prompt
} from './deps.ts';

export default async function migrations() {
	const promptdata = await prompt([
		{
			name: 'from',
			message: 'what version of bolt is the DB currently set up for?',
			type: Select,
			options: Object.values(versions)
		},
		{
			name: 'to',
			message: 'what version of bolt do you want to move to?',
			type: Select,
			options: Object.values(versions)
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

	const migrationlist = get_migrations(promptdata.from, promptdata.to);

	if (migrationlist.length < 1) Deno.exit();

	const mongo = new MongoClient();
	await mongo.connect(promptdata.mongo);
	const database = mongo.database(promptdata.prod ? 'bolt' : 'bolt-canary');

	console.log(colors.blue(`Downloading your data...`));

	const dumped = await database
		.collection(migrationlist[0].from_db)
		.find()
		.toArray();

	console.log(
		colors.blue(`Downloaded data from the DB! Migrating your data...`)
	);

	const data = apply_migrations(migrationlist, dumped);

	const filepath = Deno.makeTempFileSync({ suffix: 'bolt-db-migration' });
	Deno.writeTextFileSync(filepath, JSON.stringify(data));

	const writeconfirm = await Toggle.prompt({
		message: `Do you want to write the data at ${filepath} to the DB?`
	});

	if (!writeconfirm) Deno.exit();

	const tocollection = database.collection(migrationlist.slice(-1)[0].to_db);

	await Promise.all(
		data.map(i => {
			return tocollection.replaceOne({ _id: i._id }, i, { upsert: true });
		})
	);

	console.log(colors.green('Wrote data to the DB'));
}
