import { create_plugin } from './plugins.ts';

/** a function that returns a config object when given a partial config object */
export function define_config(config?: Partial<config>): config {
	return {
		...(config || {}),
		prod: false,
		plugins: [],
		mongo_uri: 'mongodb://localhost:27017',
		mongo_database: config?.prod ? 'bolt' : 'bolt-testing',
		redis_host: 'localhost',
		redis_port: 6379
	};
}

export interface config {
	prod: boolean;
	plugins: { type: create_plugin; config: unknown }[];
	mongo_uri: string;
	mongo_database: string;
	redis_host: string;
	redis_port?: number;
	errorURL?: string;
}
