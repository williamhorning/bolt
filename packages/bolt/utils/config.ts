import { create_plugin } from './plugins.ts';

/** a function that returns a config object when given a partial config object */
export function define_config(config?: Partial<config>): config {
	return {
		plugins: [],
		mongo_uri: 'mongodb://localhost:27017',
		mongo_database: 'lightning',
		redis_host: 'localhost',
		redis_port: 6379,
		...(config || {})
	};
}

export interface config {
	/** a list of plugins */
	plugins: { type: create_plugin; config: unknown }[];
	/** the URI that points to your instance of mongodb */
	mongo_uri: string;
	/** the database to use */
	mongo_database: string;
	/** the hostname of your redis instance */
	redis_host: string;
	/** the port of your redis instance */
	redis_port?: number;
	/** the webhook used to send errors to */
	errorURL?: string;
}
