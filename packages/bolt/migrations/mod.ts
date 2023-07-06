import { Document } from './deps.ts';
import BoltFourToFive from './fourbetatofive.ts';
import BoltFourBetaToFive from './fourtofourbeta.ts';

export enum BoltMigrationVersions {
	Four = '0.4',
	FourBeta = '0.4-beta',
	Five = '0.5'
}

export const BoltMigrationsList = [BoltFourBetaToFive, BoltFourToFive];

export function getBoltMigrations(versionFrom: string, versionTo: string) {
	const indexoffrom = BoltMigrationsList.findIndex(
		i => i.versionfrom === versionFrom
	);
	const indexofto = BoltMigrationsList.findLastIndex(
		i => i.versionto === versionTo
	);
	return BoltMigrationsList.slice(indexoffrom, indexofto + 1);
}

export async function applyBoltMigrations(
	migrations: typeof BoltMigrationsList,
	data: Document[]
) {
	let moddata = data;
	for (const migration of migrations) {
		moddata = await migration.translate(data);
	}
	return moddata;
}
