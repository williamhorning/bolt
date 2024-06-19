import {
	AppServiceRegistration,
	Bridge,
	type bridge_channel,
	DiscordMessageParser,
	existsSync,
	type lightning,
	MatrixMessageParser,
	type message,
	plugin,
} from './deps.ts';
import { onEvent } from './events.ts';
import { coreToMessage } from './to_matrix.ts';

type MatrixConfig = {
	appserviceUrl: string;
	homeserverUrl: string;
	domain: string;
	port?: number;
	reg_path: string;
};

export class matrix_plugin extends plugin<MatrixConfig> {
	bot: Bridge;
	name = 'bolt-matrix';
	todiscord = new DiscordMessageParser();
	tomatrix = new MatrixMessageParser();
	version = '0.7.0';

	constructor(l: lightning, config: MatrixConfig) {
		super(l, config);
		this.bot = new Bridge({
			homeserverUrl: this.config.homeserverUrl,
			domain: this.config.domain,
			registration: this.config.reg_path,
			controller: {
				onEvent: onEvent.bind(this),
			},
			roomStore: './config/roomStore.db',
			userStore: './config/userStore.db',
			userActivityStore: './config/userActivityStore.db',
		});
		if (!existsSync(this.config.reg_path)) {
			const reg = new AppServiceRegistration(this.config.appserviceUrl);
			reg.setAppServiceToken(AppServiceRegistration.generateToken());
			reg.setHomeserverToken(AppServiceRegistration.generateToken());
			reg.setId(AppServiceRegistration.generateToken());
			reg.setProtocols(['lightning']);
			reg.setRateLimited(false);
			reg.setSenderLocalpart('bot.lightning');
			reg.addRegexPattern(
				'users',
				`@lightning-.+_.+:${this.config.domain}`,
				true,
			);
			reg.outputAsYaml(this.config.reg_path);
		}
		this.bot.run(this.config.port || 8081);
	}

	// deno-lint-ignore require-await
	async create_bridge(channelId: string) {
		return channelId;
	}

	async create_message(
		msg: message,
		channel: bridge_channel,
		edit?: string,
		reply?: string,
	) {
		const mxid =
			`@lightning-${msg.plugin}-${msg.author.id}:${this.config.domain}`;
		const mxintent = this.bot.getIntent(mxid);
		await mxintent.ensureProfile(msg.author.username, msg.author.profile);

		const result = await mxintent.sendMessage(
			channel.id,
			await coreToMessage(msg, channel.id, mxid, reply, edit),
		);

		return result.event_id;
	}

	async edit_message(
		msg: message,
		channel: bridge_channel,
		edit_id?: string,
		reply_id?: string,
	) {
		return await this.create_message(msg, channel, edit_id, reply_id);
	}

	async delete_message(
		_msg: message,
		channel: bridge_channel,
		delete_id: string,
	) {
		const intent = this.bot.getIntent();
		await intent.botSdkIntent.underlyingClient.redactEvent(
			channel.id,
			delete_id,
			'bridge message deletion',
		);
		return delete_id;
	}
}
