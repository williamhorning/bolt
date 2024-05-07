import {
	AppServiceRegistration,
	Bridge,
	bridge_channel,
	Buffer,
	existsSync,
	lightning,
	MatrixUser,
	message,
	plugin
} from './deps.ts';
import { coreToMessage, onEvent } from './events.ts';

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
	version = '0.7.0';

	constructor(l: lightning, config: MatrixConfig) {
		super(l, config);
		this.bot = new Bridge({
			homeserverUrl: this.config.homeserverUrl,
			domain: this.config.domain,
			registration: this.config.reg_path,
			controller: {
				onEvent: onEvent.bind(this)
			},
			roomStore: './config/roomStore.db',
			userStore: './config/userStore.db',
			userActivityStore: './config/userActivityStore.db'
		});
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
		this.bot.run(this.config.port || 8081);
	}

	// deno-lint-ignore require-await
	async create_bridge(channelId: string) {
		return channelId;
	}

	async create_message(
		msg: message,
		channel: bridge_channel,
		edit_id?: string,
		reply_id?: string,
		edit?: boolean
	) {
		const name = `@${msg.plugin}_${msg.author.id}:${this.config.domain}`;
		const intent = this.bot.getIntent(name);
		await intent.ensureProfile(msg.author.username);
		const store = this.bot.getUserStore();
		let storeUser = await store?.getMatrixUser(name);
		if (!storeUser) {
			storeUser = new MatrixUser(name);
		}
		if (storeUser?.get('avatar') != msg.author.profile) {
			storeUser?.set('avatar', msg.author.profile);
			const r = await fetch(msg.author.profile || '');
			const newMxc = await intent.uploadContent(
				Buffer.from(await r.arrayBuffer()),
				{ type: r.headers.get('content-type') || 'image/png' }
			);
			await intent.ensureProfile(msg.author.username, newMxc);
			await store?.setMatrixUser(storeUser);
		}
		// now to our message
		const message = coreToMessage({ ...msg, reply_id });
		let editinfo = {};
		if (edit) {
			editinfo = {
				'm.new_content': message,
				'm.relates_to': {
					rel_type: 'm.replace',
					event_id: edit_id!
				}
			};
		}
		const result = await intent.sendMessage(channel.id, {
			...message,
			...editinfo
		});
		return result.event_id;
	}

	async edit_message(
		msg: message,
		channel: bridge_channel,
		edit_id?: string,
		reply_id?: string
	) {
		return await this.create_message(msg, channel, edit_id, reply_id, true);
	}

	async delete_message(
		_msg: message,
		channel: bridge_channel,
		delete_id: string
	) {
		const intent = this.bot.getIntent();
		await intent.botSdkIntent.underlyingClient.redactEvent(
			channel.id,
			delete_id,
			'bridge message deletion'
		);
		return delete_id;
	}
}
