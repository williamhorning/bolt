import { Document } from './deps.ts';
import BoltFourToFive from './fourbetatofive.ts';
import BoltFourBetaToFive from './fourtofourbeta.ts';

const list_migrations = [BoltFourBetaToFive, BoltFourToFive];

export type migration = (typeof list_migrations)[number];

export enum versions {
	Four = '0.4',
	FourBeta = '0.4-beta',
	Five = '0.5'
}

export function get_migrations(from: string, to: string): migration[] {
	const indexoffrom = list_migrations.findIndex(i => i.from === from);
	const indexofto = list_migrations.findLastIndex(i => i.to === to);
	return list_migrations.slice(indexoffrom, indexofto + 1);
}

export function apply_migrations(
	migrations: migration[],
	data: Document[]
): Document[] {
	return migrations.reduce((acc, migration) => migration.translate(acc), data);
}

export function _map_plugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}

export function _is_channel(channel: string): boolean {
	if (
		channel.match(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		)
	) {
		return true;
	}
	if (channel.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/gm)) return true;
	if (!isNaN(Number(channel))) return true;
	if (
		channel.startsWith('discord-') ||
		channel.startsWith('guilded-') ||
		channel.startsWith('revolt-')
	) {
		return true;
	}
	return false;
}
