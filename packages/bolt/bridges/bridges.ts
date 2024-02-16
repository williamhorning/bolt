import { bridge_commands } from './_commands.ts';
import { bridge_document, bridge_platform } from './types.ts';
import { message, bolt_plugin, Bolt, Collection } from './_deps.ts';

export class bolt_bridges {
	private collection: Collection<bridge_document>;

	constructor(bolt: Bolt) {
		bolt.on('messageCreate', async msg => {
			if (!(await this.isBridged(msg, bolt))) bolt.emit('msgcreate', msg);
		});
		bolt.on('msgcreate', msg => this.bridgeMessage(msg, bolt));
		bolt.cmds.register(bridge_commands(bolt));
		this.collection = bolt.mongo.database(bolt.database).collection('bridges');
	}

	private async bridgeMessage(msg: message<unknown>, bolt: Bolt) {
		const bridge = await this.getBridge(msg);
		if (!bridge) return;

		const platforms = bridge.platforms.filter(i => {
			return !(i.plugin == msg.platform.name && i.channel == msg.channel);
		});

		if (!platforms || platforms.length < 1) return;

		for (const platform of platforms) {
			const plugin = bolt.getPlugin(platform.plugin);
			if (!platform?.senddata || !plugin?.bridgeMessage) continue;
			try {
				await plugin.bridgeMessage({
					type: 'create',
					data: {
						...msg,
						...platform,
						bolt,
						bridgePlatform: platform
					}
				});
			} catch (e) {
				await this.handleBridgeError(e, msg, bridge, platform, plugin, bolt);
			}
		}
	}

	private async handleBridgeError(
		// deno-lint-ignore no-explicit-any
		e: Error & Record<string, any>,
		msg: message<unknown>,
		bridge: bridge_document,
		platform: bridge_platform,
		plugin: bolt_plugin,
		bolt: Bolt
	) {
		if (e?.response?.status === 404) {
			const updated_bridge = {
				...bridge,
				value: { bridges: bridge.platforms.filter(i => i !== platform) }
			};
			await this.updateBridge(updated_bridge);
			return;
		}
		const err = await bolt.logError(e, { msg, bridge });
		try {
			return await plugin.bridgeMessage!({
				type: 'create',
				data: {
					...err,
					...platform,
					bolt,
					bridgePlatform: platform
				}
			});
		} catch (e2) {
			await bolt.logError(
				new Error(`sending error message for ${err.uuid} failed`, {
					cause: [e2]
				})
			);
		}
	}

	async isBridged(msg: message<unknown>, bolt: Bolt) {
		const platform_says = bolt.getPlugin(msg.platform.name)!.isBridged!(msg);

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

	async updateBridge(bridge: bridge_document) {
		return await this.collection.replaceOne({ _id: bridge._id }, bridge, {
			upsert: true
		});
	}
}
