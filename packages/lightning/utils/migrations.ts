import { Document } from 'mongo';
import fourfourbeta from './_fourfourbeta.ts';
import fourbetafive from './_fourfourbeta.ts';

/** the type of a migration */
export interface migration {
	/** the version to translate from */
	from: versions;
	/** the version to translate to */
	to: versions;
	/** the database to translate from */
	from_db: string;
	/** the database to translate to */
	to_db: string;
	/** translate a document from one version to another */
	translate: (data: Document[]) => Document[];
}

/** all of the versions with migrations to/from them */
export enum versions {
	/** all versions below 0.5 */
	Four = '0.4',
	/** versions after commit 7de1cf2 but below 0.5 */
	FourBeta = '0.4-beta',
	/** versions 0.5 and above */
	Five = '0.5'
}

const migrations: migration[] = [fourbetafive, fourfourbeta];

/** get migrations that can then be applied using apply_migrations */
export function get_migrations(from: versions, to: versions): migration[] {
	const indexoffrom = migrations.findIndex(i => i.from === from);
	const indexofto = migrations.findLastIndex(i => i.to === to);
	return migrations.slice(indexoffrom, indexofto);
}

/** apply many migrations given mongodb documents */
export function apply_migrations(
	migrations: migration[],
	data: Document[]
): Document[] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}
