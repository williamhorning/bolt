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
		mongo: MongoConnectOptions | string;
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
		config.database = { mongo: 'mongodb://localhost:27017' };
	if (!config.database.mongo)
		config.database.mongo = 'mongodb://localhost:27017';
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

export async function logBoltError(
	bolt: Bolt,
	{ e, extra, code }: { e: Error; extra: Record<string, unknown>; code: string }
) {
	const id = crypto.randomUUID();
	e.cause = { e, id, extra, code };
	const msg = `Bolt Error:\n${bolt.plugins.length} plugins - ${
		Deno.build.target
	} - ${id} - ${code}\n\`\`\`json\n${JSON.stringify(
		e
	)}\n\`\`\`\n\`\`\`json\n${extra}\n\`\`\``;
	if (bolt.config.http.errorURL) {
		try {
			await fetch(bolt.config.http.errorURL, {
				method: 'POST',
				body: msg
			});
		} catch {
			console.error(`logging error ${id} failed`);
		}
	}
	const boltError = {
		e,
		message: createBoltMessage({
			content: `Something went wrong: ${code}! Join the Bolt support server and share the following: \`\`\`\n${e.message}\n${id}\`\`\``
		}),
		code
	};
	bolt.emit('error', boltError);
	return boltError;
}
