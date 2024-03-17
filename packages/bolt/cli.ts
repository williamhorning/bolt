import { Bolt } from './bolt.ts';
import { parseArgs } from 'std_args';
import { MongoClient } from 'mongo';
import {
	apply_migrations,
	get_migrations,
	versions,
	config,
	define_config
} from './utils/mod.ts';

function log(text: string, color?: string, type?: 'error' | 'log') {
	console[type || 'log'](`%c${text}`, `color: ${color || 'white'}`);
}

const f = parseArgs(Deno.args, {
	boolean: ['help', 'version', 'run', 'migrations'],
	string: ['config']
});

if (f.version) {
	log('0.5.8');
	Deno.exit();
}

if (!f.run && !f.migrations) {
	log('bolt v0.5.8 - cross-platform bot connecting communities', 'blue');
	log('Usage: bolt [options]', 'purple');
	log('Options:', 'green');
	log('--help: show this');
	log('--version: shows version');
	log('--config <string>: absolute path to config file');
	log('--run: run an of bolt using the settings in config.ts');
	log('--migrations: start interactive tool to migrate databases');
	Deno.exit();
}

try {
	if (!Deno) throw new Error('not running on deno, exiting...');

	const cfg = define_config(
		(await import(f.config || `${Deno.cwd()}/config.ts`))?.default
	);

	Deno.env.set('BOLT_ERROR_HOOK', cfg.errorURL || '');

	const mongo = new MongoClient();
	await mongo.connect(cfg.mongo_uri);

	const redis = await Deno.connect({
		hostname: cfg.redis_host,
		port: cfg.redis_port || 6379
	});

	if (f.run) {
		new Bolt(cfg, mongo, redis);
	} else if (f.migrations) {
		await migrations(cfg, mongo);
	}
} catch (e) {
	log('Something went wrong, exiting...', 'red', 'error');
	log(e, 'red', 'error');
	Deno.exit(1);
}

async function migrations(cfg: config, mongo: MongoClient) {
	log(`Available versions are: ${Object.values(versions).join(', ')}`, 'blue');

	const from = prompt('what version is the DB currently set up for?');
	const to = prompt('what version of bolt do you want to move to?');

	const is_invalid = (val: string) =>
		!(Object.values(versions) as string[]).includes(val);

	if (!from || !to || is_invalid(from) || is_invalid(to)) return Deno.exit(1);

	const migrationlist = get_migrations(from as versions, to as versions);

	if (migrationlist.length < 1) Deno.exit();

	const database = mongo.database(cfg.mongo_database);

	log('Migrating your data..', 'blue');

	const dumped = await database
		.collection(migrationlist[0].from_db)
		.find()
		.toArray();

	const data = apply_migrations(migrationlist, dumped);

	const filepath = Deno.makeTempFileSync();
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

	log('Wrote data to the DB', 'green');

	Deno.exit();
}
