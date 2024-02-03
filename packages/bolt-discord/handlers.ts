import {
	Bolt,
	BoltThread,
	GatewayDispatchEvents,
	GatewayThreadDeleteDispatchData,
	GatewayThreadUpdateDispatchData,
	WithIntrinsicProps
} from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';
import { default as DiscordPlugin } from './mod.ts';

export function threadEvent(
	thread: WithIntrinsicProps<
		GatewayThreadUpdateDispatchData | GatewayThreadDeleteDispatchData
	>,
	nojoin?: boolean
): BoltThread | void {
	if (
		thread.data.type === 10 ||
		thread.data.type === 11 ||
		thread.data.type === 12
	) {
		if (!nojoin) thread.api.threads.join(thread.data.id);
		return {
			id: thread.data.id,
			name: thread.data.name,
			parent: thread.data.parent_id || ''
		};
	}
}

export function registerEvents(plugin: DiscordPlugin, bolt: Bolt) {
	plugin.bot.on(GatewayDispatchEvents.Ready, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.Resumed, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.ThreadCreate, thread => {
		const data = threadEvent(thread);
		if (data) plugin.emit('threadCreate', data);
	});
	plugin.bot.on(GatewayDispatchEvents.ThreadDelete, thread => {
		const data = threadEvent(thread, true);
		if (data) plugin.emit('threadDelete', data);
	});
	plugin.bot.on(GatewayDispatchEvents.MessageCreate, async message =>
		plugin.emit('messageCreate', await messageToCore(message.api, message.data))
	);
	plugin.bot.on(GatewayDispatchEvents.MessageUpdate, async message =>
		plugin.emit('messageUpdate', await messageToCore(message.api, message.data))
	);
	plugin.bot.on(GatewayDispatchEvents.MessageDelete, message =>
		plugin.emit('messageDelete', {
			id: message.data.id,
			platform: {
				name: 'bolt-discord',
				message
			},
			channel: message.data.channel_id,
			guild: message.data.guild_id,
			timestamp: Date.now()
		})
	);
	plugin.bot.on(GatewayDispatchEvents.InteractionCreate, async interaction => {
		if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
		const opts = interaction.data.data.options;
		let arg = '';
		if (opts && opts[0]) {
			const opt = opts[0];
			arg += opt.name;
			if (opt.type === 1) {
				for (const i of opt.options || []) {
					arg += ` ${i.value}`;
				}
			}
		}
		await bolt.cmds.runCommand({
			name: interaction.data.data.name,
			reply: async msg => {
				await interaction.api.interactions.reply(
					interaction.data.id,
					interaction.data.token,
					await coreToMessage(msg)
				);
			},
			channel: interaction.data.channel.id,
			platform: 'bolt-discord',
			arg,
			timestamp: Date.now()
		});
	});
}
