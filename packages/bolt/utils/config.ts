import { MongoConnectOptions, RedisConnectOptions } from '../deps.ts';
import { bolt_plugin } from './plugins.ts';

export function define_config(config?: Partial<config>): config {
	if (!config) config = {};
	if (!config.prod) config.prod = false;
	if (!config.plugins) config.plugins = [];
	if (!config.database) {
		config.database = {
			mongo: {
				connection: 'mongodb://localhost:27017',
				database: 'bolt-testing'
			},
			redis: { hostname: 'localhost' }
		};
	}
	if (!config.database.mongo) {
		config.database.mongo = {
			connection: 'mongodb://localhost:27017',
			database: config.prod ? 'bolt' : 'bolt-testing'
		};
	}
	if (!config.database.redis) {
		config.database.redis = { hostname: 'localhost' };
	}
	if (!config.http) {
		config.http = {
			apiURL: 'http://localhost:9090',
			dashURL: 'http://localhost:9091'
		};
	}
	if (!config.http.apiURL) config.http.apiURL = 'http://localhost:9090';
	if (!config.http.dashURL) config.http.dashURL = 'http://localhost:9091';
	return config as config;
}

export interface config {
	prod: boolean;
	plugins: bolt_plugin[];
	database: {
		mongo: {
			connection: MongoConnectOptions | string;
			database: string;
		};
		redis: RedisConnectOptions;
	};
	http: { dashURL?: string; apiURL?: string; errorURL?: string };
}
