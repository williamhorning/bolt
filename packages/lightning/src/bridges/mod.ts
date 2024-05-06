import type { lightning } from '../lightning.ts';
import type { bridge_document } from '../types.ts';
import { bridge_commands } from './commands.ts';
import { handle_message } from './handle_message.ts';

/** a thing that bridges messages between plugins */
export class bridges {
	/** the parent instance of lightning */
	private l: lightning;

	/** create a bridge instance and attach to lightning */
	constructor(l: lightning) {
		this.l = l;
		l.on('create_message', async msg => {
			await new Promise(res => setTimeout(res, 15));
			if (await this.is_bridged(msg.id)) return;
			l.emit('create_nonbridged_message', msg);
			handle_message(l, msg, 'create_message');
		});
		l.on('edit_message', async msg => {
			await new Promise(res => setTimeout(res, 15));
			if (await this.is_bridged(msg.id)) return;
			handle_message(l, msg, 'edit_message');
		});
		l.on('delete_message', async msg => {
			await new Promise(res => setTimeout(res, 15));
			handle_message(l, msg, 'delete_message');
		});
		l.commands.set('bridge', bridge_commands(l));
	}

	/**
	 * get all the channels a message was bridged to
	 * @param id the id of the message to get the channels for
	 */
	async get_bridge_message(id: string): Promise<bridge_document | undefined> {
		const rdata = await this.l.redis.sendCommand([
			'GET',
			`lightning-bridged-${id}`
		]);
		if (!rdata || rdata == 'OK') return;
		return JSON.parse(rdata as string) as bridge_document;
	}

	/**
	 * check if a message was bridged
	 * @param id the id of the message to check
	 */
	async is_bridged(id: string): Promise<boolean> {
		return Boolean(
			await this.l.redis.sendCommand(['EXISTS', `lightning-bridged-${id}`])
		);
	}

	/**
	 * check if a channel is in a bridge
	 * @param channel the channel to check
	 */
	async is_in_bridge(channel: string): Promise<boolean> {
		return Boolean(
			Number(
				await this.l.redis.sendCommand([
					'EXISTS',
					`lightning-bchannel-${channel}`
				])
			)
		);
	}

	/**
	 * get a bridge using the bridges name or a channel in it
	 * @param param0 the id or channel of the bridge
	 */
	async get_bridge({
		id,
		channel
	}: {
		id?: string;
		channel?: string;
	}): Promise<bridge_document | undefined> {
		if (channel) {
			id = (await this.l.redis.sendCommand([
				'GET',
				`lightning-bchannel-${channel}`
			])) as string;
		}
		return JSON.parse(
			(await this.l.redis.sendCommand([
				'GET',
				`lightning-bridge-${id}`
			])) as string
		);
	}

	/**
	 * update a bridge in a database
	 * @param bridge the bridge to update
	 */
	async set_bridge(bridge: bridge_document): Promise<void> {
		await this.l.redis.sendCommand([
			'SET',
			`lightning-bridge-${bridge.id}`,
			JSON.stringify(bridge)
		]);
	}
}
