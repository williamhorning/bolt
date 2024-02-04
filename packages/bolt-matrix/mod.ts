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
	appserviceUrl: string;
	homeserverUrl: string;
	domain: string;
	port?: number;
	reg_path: string;
};

export default class MatrixPlugin extends BoltPlugin {
	bot: Bridge;
	config: MatrixConfig;
	name = 'bolt-matrix';
	version = '0.5.4';
	bolt?: Bolt;
	constructor(config: MatrixConfig) {
		super();
		this.config = config;
		this.bot = new Bridge({
			homeserverUrl: this.config.homeserverUrl,
			domain: this.config.domain,
			registration: this.config.reg_path,
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
			const reg = new AppServiceRegistration(this.config.appserviceUrl);
			reg.setAppServiceToken(AppServiceRegistration.generateToken());
			reg.setHomeserverToken(AppServiceRegistration.generateToken());
			reg.setId(AppServiceRegistration.generateToken());
			reg.setProtocols(['bolt']);
			reg.setRateLimited(false);
			reg.setSenderLocalpart('bot.bolt');
			reg.addRegexPattern('users', `@bolt-.+_.+:${this.config.domain}`, true);
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
		const room = data.data.bridgePlatform.senddata as string;
		switch (data.type) {
			case 'create':
			case 'update': {
				const intent = this.bot.getIntent(
					`@${data.data.platform.name}_${data.data.author.id}:${this.config.domain}`
				);
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
				const intent = this.bot.getIntent();
				await intent.botSdkIntent.underlyingClient.redactEvent(
					room, data.data.id, 'bridge message deletion'
				);
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
