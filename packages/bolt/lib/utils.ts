import { Bolt } from './bolt.ts';
import {
	BoltBridgeMessageArgs,
	BoltBridgeSentPlatform,
	BoltBridgeThreadArgs
} from './bridge/mod.ts';
import { BoltCommand } from './commands/types.ts';
import {
	EventEmitter,
	MongoConnectOptions,
	RedisConnectOptions
} from './deps.ts';
import {
	BoltEmbed,
	BoltMessage,
	BoltPluginEvents,
	BoltThread
} from './types.ts';

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

type CreateBoltMessageOptions = {
	content?: string;
	embeds?: [BoltEmbed, ...BoltEmbed[]];
};

export function createBoltMessage(
	opts: CreateBoltMessageOptions
): BoltMessage<CreateBoltMessageOptions> {
	return {
		author: {
			rawname: 'Bolt',
			username: 'Bolt',
			id: 'bolt'
		},
		...opts,
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Date.now(),
		platform: {
			name: 'bolt',
			message: opts
		}
	};
}

export class BoltError extends Error {
	code: string;
	extra: Record<string, unknown>;
	id: string;
	boltmessage: BoltMessage<CreateBoltMessageOptions>;
	e = this;
	name = 'BoltError';
	constructor(
		message: string,
		options: {
			extra?: Record<string, unknown>;
			code: string;
			cause?: Error;
		}
	) {
		super(message, { cause: options.cause });
		this.code = options.code;
		this.extra = options.extra || {};
		this.id = crypto.randomUUID();
		this.boltmessage = createBoltMessage({
			content: `Something went wrong: ${this.code}! Join the Bolt support server and share the following: \`\`\`\n${message}\n${this.id}\`\`\``
		});
	}
}

export async function logBoltError(
	bolt: Bolt,
	{
		message,
		cause,
		extra,
		code
	}: {
		message: string;
		cause?: Error;
		extra: Record<string, unknown>;
		code: string;
	}
) {
	const e = new BoltError(message, {
		cause,
		extra,
		code
	});
	if (bolt.config.http.errorURL) {
		try {
			const msg = `Bolt Error:\n${bolt.plugins.length} plugins - ${
				Deno.build.target
			} - ${e.id} - ${code}\n${message}\n${
				cause ? `\`\`\`json\n${JSON.stringify(cause)}\n\`\`\`\n` : ''
			}\`\`\`json\n${extra}\n\`\`\``;
			await fetch(bolt.config.http.errorURL, {
				method: 'POST',
				body: msg
			});
		} catch {
			bolt.emit(
				'error',
				new BoltError(`logging error ${e.id} failed`, {
					code: 'ErrorLogFailed'
				})
			);
		}
	}
	bolt.emit('error', e);
	return e;
}
