import {
	apply_migrations,
	get_migrations,
	versions
} from './migrations/mod.ts';
import { Bolt } from './bolt.ts';
import { MongoClient, parseArgs } from './_deps.ts';

const c = {
	name: 'bolt',
	version: '0.5.5',
	description: 'Cross-platform bot connecting communities',
	colors: {
		red: 'color: red',
		blue: 'color: blue',
		green: 'color: green',
		purple: 'color: purple'
	}
};

const f = parseArgs(Deno.args, {
	boolean: ['help', 'version', 'run', 'migrations'],
	string: ['config']
});

if (f.help) {
	run_help();
} else if (f.version) {
	console.log(c.version);
	Deno.exit();
} else if (f.run) {
	await run_bolt();
} else if (f.migrations) {
	await run_migrations();
} else {
	run_help();
}

function run_help() {
	console.log(`%c${c.name} v${c.version} - ${c.description}`, c.colors.blue);
	console.log('%cUsage: bolt [options]', c.colors.purple);
	console.log('%cOptions:', c.colors.green);
	console.log('--help: Show this help.');
	console.log('--version: Show version.');
	console.log('--run: run an of bolt using the settings in config.ts');
	console.log('--config <string>: absolute path to config file');
	console.log('--migrations: Start interactive tool to migrate databases');
	Deno.exit();
}

async function run_bolt() {
	let cfg;

	try {
		cfg = (await import(f.config || `${Deno.cwd()}/config.ts`))?.default;
	} catch (e) {
		console.error(`%cCan't load your config, exiting...\n`, c.colors.red);
		console.error(e);
		Deno.exit(1);
	}

	try {
		await Bolt.setup(cfg);
	} catch (e) {
		console.error(
			`%cSomething went wrong with bolt, exiting...\n`,
			c.colors.red
		);
		console.error(e);
		Deno.exit(1);
	}
}

async function run_migrations() {
	console.log(
		`%cAvailable versions are: ${Object.values(versions).join(', ')}`,
		c.colors.blue
	);

	const version_from = prompt('what version is the DB currently set up for?');
	const version_to = prompt('what version of bolt do you want to move to?');
	const db_uri = prompt('Input your MongoDB connection URI');
	const prod = confirm('Did you run Bolt in prod mode?');

	if (!version_from || !version_to || !db_uri) Deno.exit();

	if (version_from === version_to) {
		console.log(
			'%cYou are already on the version you want to move to',
			c.colors.red
		);
		Deno.exit();
	}

	if (
		!(Object.values(versions) as string[]).includes(version_from) ||
		!(Object.values(versions) as string[]).includes(version_to)
	) {
		console.log('%cInvalid version(s) entered', c.colors.red);
		Deno.exit(1);
	}

	const migrationlist = get_migrations(version_from, version_to);

	if (migrationlist.length < 1) Deno.exit();

	const mongo = new MongoClient();
	await mongo.connect(db_uri);
	const database = mongo.database(prod ? 'bolt' : 'bolt-canary');

	console.log(`%cDownloading your data...`, c.colors.blue);

	const dumped = await database
		.collection(migrationlist[0].from_db)
		.find()
		.toArray();

	console.log(
		`%cDownloaded data from the DB! Migrating your data...`,
		c.colors.blue
	);

	const data = apply_migrations(migrationlist, dumped);

	const filepath = Deno.makeTempFileSync({ suffix: 'bolt-db-migration' });
	Deno.writeTextFileSync(filepath, JSON.stringify(data));

	const writeconfirm = confirm(
		`Do you want to write the data at ${filepath} to the DB?`
	);

	if (!writeconfirm) Deno.exit();

	const tocollection = database.collection(migrationlist.slice(-1)[0].to_db);

	await Promise.all(
		data.map(i => {
			return tocollection.replaceOne({ _id: i._id }, i, { upsert: true });
		})
	);

	console.log('%cWrote data to the DB', c.colors.green);
	Deno.exit();
}
