import { Document } from 'mongo';
import fourfourbeta from './_fourfourbeta.ts';
import fourbetafive from './_fourfourbeta.ts';

const migrations = [fourbetafive, fourfourbeta];

/** the type of a migration */
export type migration = (typeof migrations)[number];

/** all of the versions with migrations to/from them */
export enum versions {
	Four = '0.4',
	FourBeta = '0.4-beta',
	Five = '0.5'
}

/** get migrations that can then be applied */
export function get_migrations(from: string, to: string): migration[] {
	const indexoffrom = migrations.findIndex(i => i.from === from);
	const indexofto = migrations.findLastIndex(i => i.to === to);
	return migrations.slice(indexoffrom, indexofto);
}

/** apply many migrations */
export function apply_migrations(
	migrations: migration[],
	data: Document[]
): Document[] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}
