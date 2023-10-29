import {
	AppServiceRegistration,
	Bolt,
	BoltBridgeMessageArgs,
	BoltMessage,
	BoltPlugin,
	Bridge,
	ClientEncryptionSession,
	existsSync
} from './deps.ts';
import { coreToMessage, onEvent } from './events.ts';

type MatrixConfig = {
	accessToken: string;
	homeserverUrl: string;
	domain: string;
	port?: number;
	reg_path: string;
};

export default class MatrixPlugin extends BoltPlugin {
	bot: Bridge;
	config: MatrixConfig;
	name = 'bolt-revolt';
	version = '0.5.3';
	bolt?: Bolt;
	constructor(config: MatrixConfig) {
		super();
		this.config = config;
		this.bot = new Bridge({
			homeserverUrl: this.config.homeserverUrl,
			domain: this.config.domain,
			registration: this.config.reg_path,
			bridgeEncryption: {
				homeserverUrl: config.homeserverUrl,
				store: {
					getStoredSession: async (userId: string) => {
						return JSON.parse(
							(await this.bolt?.redis?.get(`mtx-session-${userId}`)) || 'null'
						);
					},
					setStoredSession: async (session: ClientEncryptionSession) => {
						await this.bolt?.redis?.set(
							`mtx-session-${session.userId}`,
							JSON.stringify(session)
						);
					},
					async updateSyncToken() {}
				}
			},
			controller: {
				onEvent: onEvent.bind(this)
			},
			roomStore: './db/roomStore.db',
			userStore: './db/userStore.db',
			userActivityStore: './db/userActivityStore.db'
		});
	}
	async start(bolt: Bolt) {
		this.bolt = bolt;
		if (!existsSync(this.config.reg_path)) {
			const reg = new AppServiceRegistration(this.config.homeserverUrl);
			reg.setAppServiceToken(AppServiceRegistration.generateToken());
			reg.setHomeserverToken(AppServiceRegistration.generateToken());
			reg.setId(
				'b4d15f02f7e406db25563c1a74ac78863dc4fbcc5595db8d835f6ee6ffef1448'
			);
			reg.setProtocols(['bolt']);
			reg.setRateLimited(false);
			reg.setSenderLocalpart('boltbot');
			reg.addRegexPattern('users', '@bolt_*', true);
			reg.outputAsYaml(this.config.reg_path);
		}
		await this.bot.run(this.config.port || 8081);
	}
	bridgeSupport = { text: true };
	// deno-lint-ignore require-await
	async createSenddata(channelId: string) {
		return channelId;
	}
	async bridgeMessage(data: BoltBridgeMessageArgs) {
		const intent = this.bot.getIntent(
			`${data.data.platform.name}_${
				'author' in data.data ? data.data.author.id : 'deletion'
			}`
		);
		const room = data.data.bridgePlatform.senddata as string;
		switch (data.type) {
			case 'create':
			case 'update': {
				const message = coreToMessage(
					data.data as unknown as BoltMessage<unknown>
				);
				let editinfo = {};
				if (data.type === 'update') {
					editinfo = {
						'm.new_content': message,
						'm.relates_to': {
							rel_type: 'm.replace',
							event_id: data.data.id
						}
					};
				}
				const result = await intent.sendMessage(room, {
					...message,
					...editinfo
				});
				return {
					channel: room,
					id: result.event_id,
					plugin: 'bolt-matrix',
					senddata: room
				};
			}
			case 'delete': {
				await intent.sendEvent(room, 'm.room.redaction', {
					content: {
						reason: 'bridge message deletion'
					},
					redacts: data.data.id
				});
				return {
					channel: room,
					id: data.data.id,
					plugin: 'bolt-matrix',
					senddata: room
				};
			}
		}
	}
}
