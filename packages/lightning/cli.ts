import { parseArgs, MongoClient } from './deps.ts';
import { lightning } from './lightning.ts';
import { versions } from './src/types.ts';
import {
	apply_migrations,
	define_config,
	get_migrations,
	log_error
} from './src/utils.ts';

function log(text: string, color?: string, type?: 'error' | 'log') {
	console[type || 'log'](`%c${text}`, `color: ${color || 'white'}`);
}

const args = parseArgs(Deno.args, {
	string: ['config']
});

switch (args._[0]) {
	case 'version': {
		log('0.6.0');
		break;
	}
	case 'run': {
		try {
			const cfg = define_config(
				(await import(args.config || `${Deno.cwd()}/config.ts`))?.default
			);

			Deno.env.set('LIGHTNING_ERROR_HOOK', cfg.errorURL || '');

			const redis = await Deno.connect({
				hostname: cfg.redis_host,
				port: cfg.redis_port || 6379
			});

			new lightning(cfg, redis);
		} catch (e) {
			await log_error(e);
			Deno.exit(1);
		}
		break;
	}
	case 'migrations': {
		log(
			`Available versions are: ${Object.values(versions).join(', ')}`,
			'blue'
		);

		const from = prompt('what version is the DB currently set up for?');
		const to = prompt('what version of lightning do you want to move to?');
		const uri = prompt('what is your database uri?');
		const db = prompt('which database are you using right now?');

		const is_invalid = (val: string) =>
			!(Object.values(versions) as string[]).includes(val);

		if (!from || !to || !uri || !db || is_invalid(from) || is_invalid(to))
			Deno.exit(1);

		const migrationlist = get_migrations(from as versions, to as versions);

		if (migrationlist.length < 1) break;

		const mongo = new MongoClient();

		await mongo.connect(uri);

		const database = mongo.database(db);

		log('Migrating your data..', 'blue');

		const dumped = (
			await database.collection(migrationlist[0].from_db).find().toArray()
		).map<[string, unknown]>(i => [i._id, i]);

		const data = apply_migrations(migrationlist, dumped);

		const filepath = Deno.makeTempFileSync();
		Deno.writeTextFileSync(filepath, JSON.stringify(data));

		const writeconfirm = confirm(
			`Do you want to write the data at ${filepath} to the DB?`
		);

		if (!writeconfirm) break;

		const tocollection = database.collection(migrationlist.slice(-1)[0].to_db);

		await Promise.all(
			data.map(([_id, value]) => {
				return tocollection.replaceOne({ _id }, value as Record<string, unknown>, {
					upsert: true
				});
			})
		);

		log('Wrote data to the DB', 'green');

		break;
	}
	default: {
		log('lightning v0.6.0 - cross-platform bot connecting communities', 'blue');
		log('Usage: lightning [subcommand] <options>', 'purple');
		log('Subcommands:', 'green');
		log('help: show this');
		log('run: run an of lightning using the settings in config.ts');
		log('migrations: run migration script');
		log('version: shows version');
		log('Options:', 'green');
		log('--config <string>: absolute path to config file');
		break;
	}
}
