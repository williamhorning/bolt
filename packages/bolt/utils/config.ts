import { create_plugin } from './plugins.ts';

/** a function that returns a config object when given a partial config object */
export function define_config(config?: Partial<config>): config {
	if (!config) config = {};
	if (!config.prod) config.prod = false;
	if (!config.plugins) config.plugins = [];
	if (!config.mongo_uri) config.mongo_uri = 'mongodb://localhost:27017';
	if (!config.mongo_database)
		config.mongo_database = config.prod ? 'bolt' : 'bolt-testing';
	if (!config.redis_host) config.redis_host = 'localhost';
	return config as config;
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
