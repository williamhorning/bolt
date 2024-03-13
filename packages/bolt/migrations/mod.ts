import { Document } from '../_deps.ts';
import BoltFourToFourBeta from './fourtofourbeta.ts';
import BoltFourBetaToFive from './fourtofourbeta.ts';

const list_migrations = [BoltFourBetaToFive, BoltFourToFourBeta];

export type migration = (typeof list_migrations)[number];

export enum versions {
	Four = '0.4',
	FourBeta = '0.4-beta',
	Five = '0.5'
}

export function get_migrations(from: string, to: string): migration[] {
	const indexoffrom = list_migrations.findIndex(i => i.from === from);
	const indexofto = list_migrations.findLastIndex(i => i.to === to);
	return list_migrations.slice(indexoffrom, indexofto);
}

export function apply_migrations(
	migrations: migration[],
	data: Document[]
): Document[] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}
