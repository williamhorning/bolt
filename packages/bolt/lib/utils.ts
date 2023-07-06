import { Bolt } from './bolt.ts';
import {
	BoltBridgeMessageArgs,
	BoltBridgeSentPlatform,
	BoltBridgeThreadArgs
} from './bridge/mod.ts';
import { BoltCommand } from './commands/mod.ts';
import {
	EventEmitter,
	MongoConnectOptions,
	RedisConnectOptions
} from './deps.ts';
import { BoltPluginEvents, BoltThread } from './types.ts';

export interface BoltConfig {
	prod: boolean;
	plugins: BoltPlugin[];
	database: {
		mongo: MongoConnectOptions | string;
		redis?: RedisConnectOptions;
	};
	http: { dashUrl?: string; apiURL?: string };
}

export abstract class BoltPlugin extends EventEmitter<BoltPluginEvents> {
	abstract name: string;
	abstract version: string;
	apiVersion = '1';
	bridgeSupport?: {
		text?: boolean;
		threads?: boolean;
		forum?: boolean;
		voice?: false;
	} = {};
	commands?: BoltCommand[];
	createSenddata?(channel: string): Promise<unknown>;
	bridgeMessage?(data: BoltBridgeMessageArgs): Promise<BoltBridgeSentPlatform>;
	bridgeThread?(data: BoltBridgeThreadArgs): Promise<BoltThread>;
	abstract start(bolt: Bolt): Promise<void> | void;
	stop?(): Promise<void> | void;
}

export function defineBoltConfig(config?: Partial<BoltConfig>): BoltConfig {
	if (!config) config = {};
	if (!config.prod) config.prod = false;
	if (!config.plugins) config.plugins = [];
	if (!config.database)
		config.database = { mongo: 'mongodb://localhost:27017' };
	if (!config.database.mongo)
		config.database.mongo = 'mongodb://localhost:27017';
	if (!config.http)
		config.http = {
			apiURL: 'http://localhost:9090',
			dashUrl: 'http://localhost:9091'
		};
	if (!config.http.apiURL) config.http.apiURL = 'http://localhost:9090';
	if (!config.http.dashUrl) config.http.dashUrl = 'http://localhost:9091';
	return config as BoltConfig;
}
