if (import.meta.main) {
	await import('./cli/mod.ts');
}

export * from './lib/mod.ts';
export * from './migrations/mod.ts';
