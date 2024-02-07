import { bridgecommands } from './bridge_commands.ts';
import { Bolt, BoltMessage, BoltPlugin, Collection } from './deps.ts';

export class BoltBridges {
	private bolt: Bolt;
	private collection: Collection<BoltBridgeDocument>;

	constructor(bolt: Bolt) {
		this.bolt = bolt;
		this.bolt.on('messageCreate', async msg => {
			if (!(await this.isBridged(msg))) this.bolt.emit('msgcreate', msg);
		});
		this.bolt.on('msgcreate', msg => this.bridgeMessage(msg));
		this.bolt.cmds.registerCommands(...bridgecommands);
		this.collection = bolt.mongo.database(bolt.database).collection('bridges');
	}

	private async bridgeMessage(msg: BoltMessage<unknown>) {
		const bridge = await this.getBridge(msg);
		if (!bridge) return;

		const platforms = bridge.platforms.filter(i => {
			return !(i.plugin == msg.platform.name && i.channel == msg.channel);
		});

		if (!platforms || platforms.length < 1) return;

		for (const platform of platforms) {
			const plugin = this.bolt.getPlugin(platform.plugin);
			if (!platform?.senddata || !plugin?.bridgeMessage) continue;
			try {
				await plugin.bridgeMessage({
					data: {
						...msg,
						...platform,
						bolt: this.bolt,
						bridgePlatform: platform
					}
				});
			} catch (e) {
				await this.handleBridgeError(e, msg, bridge, platform, plugin);
			}
		}
	}

	private async handleBridgeError(
		// deno-lint-ignore no-explicit-any
		e: Error & Record<string, any>,
		msg: BoltMessage<unknown>,
		bridge: BoltBridgeDocument,
		platform: BoltBridgePlatform,
		plugin: BoltPlugin
	) {
		if (e?.response?.status === 404) {
			const updated_bridge = {
				...bridge,
				value: { bridges: bridge.platforms.filter(i => i !== platform) }
			};
			await this.updateBridge(updated_bridge);
			return;
		}
		const err = await this.bolt.logError(e, { msg, bridge });
		try {
			return await plugin.bridgeMessage!({
				data: {
					...err,
					...platform,
					bolt: this.bolt,
					bridgePlatform: platform
				}
			});
		} catch (e2) {
			await this.bolt.logError(
				new Error(`sending error message for ${err.uuid} failed`, {
					cause: [e2]
				})
			);
		}
	}

	async isBridged(msg: BoltMessage<unknown>) {
		const platform_says = this.bolt.getPlugin(msg.platform.name)!.isBridged!(
			msg
		);

		if (platform_says !== 'query') return platform_says;
		if (!msg.platform.webhookid) return false;

		const query = {
			plugin: msg.platform.name,
			channel: msg.channel,
			'senddata.id': msg.platform.webhookid
		};

		return await this.collection.findOne({ platforms: { $elemMatch: query } });
	}

	async getBridge({ _id, channel }: { _id?: string; channel?: string }) {
		const query = {} as Record<string, string>;

		if (_id) {
			query._id = _id;
		}
		if (channel) {
			query['platforms.channel'] = channel;
		}
		return (await this.collection.findOne(query)) || undefined;
	}

	async updateBridge(bridge: BoltBridgeDocument) {
		return await this.collection.replaceOne({ _id: bridge._id }, bridge, {
			upsert: true
		});
	}
}

export interface BoltBridgeDocument {
	_id: string;
	platforms: BoltBridgePlatform[];
	settings?: {
		realnames?: boolean;
	};
}

export interface BoltBridgePlatform {
	channel: string;
	plugin: string;
	senddata: unknown;
}

export interface BoltBridgeSentPlatform extends BoltBridgePlatform {
	id: string;
}

export interface BoltBridgeMessage
	extends Omit<BoltMessage<unknown>, 'replyto'>,
		BoltBridgePlatform {
	bolt: Bolt;
	bridgePlatform: BoltBridgePlatform;
	replytoId?: string;
}

export type BoltBridgeMessageArgs = {
	data: BoltBridgeMessage;
};
