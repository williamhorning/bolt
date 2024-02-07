import {
	EventEmitter,
	MongoConnectOptions,
	RedisConnectOptions
} from './deps.ts';
import {
	Bolt,
	BoltMessage,
	BoltPluginEvents,
	BoltBridgeMessageArgs,
	BoltBridgeSentPlatform
} from './mod.ts';

export interface BoltConfig {
	prod: boolean;
	plugins: BoltPlugin[];
	database: {
		mongo: {
			connection: MongoConnectOptions | string;
			database: string;
		};
		redis?: RedisConnectOptions;
	};
	http: { dashURL?: string; apiURL?: string; errorURL?: string };
}

export abstract class BoltPlugin extends EventEmitter<BoltPluginEvents> {
	abstract name: string;
	abstract version: string;
	boltversion = '1';
	bridgeSupport?: {
		text?: boolean;
	} = {};
	createSenddata?(channel: string): Promise<unknown>;
	bridgeMessage?(data: BoltBridgeMessageArgs): Promise<BoltBridgeSentPlatform>;
	isBridged?(data: BoltMessage<unknown>): boolean | 'query';
	abstract start(bolt: Bolt): Promise<void> | void;
}

export function defineBoltConfig(config?: Partial<BoltConfig>): BoltConfig {
	if (!config) config = {};
	if (!config.prod) config.prod = false;
	if (!config.plugins) config.plugins = [];
	if (!config.database)
		config.database = {
			mongo: {
				connection: 'mongodb://localhost:27017',
				database: 'bolt-testing'
			}
		};
	if (!config.database.mongo)
		config.database.mongo = {
			connection: 'mongodb://localhost:27017',
			database: config.prod ? 'bolt' : 'bolt-testing'
		};
	if (!config.http)
		config.http = {
			apiURL: 'http://localhost:9090',
			dashURL: 'http://localhost:9091'
		};
	if (!config.http.apiURL) config.http.apiURL = 'http://localhost:9090';
	if (!config.http.dashURL) config.http.dashURL = 'http://localhost:9091';
	return config as BoltConfig;
}
