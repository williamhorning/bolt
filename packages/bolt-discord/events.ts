import { GatewayDispatchEvents } from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';
import { discord_plugin } from './mod.ts';

export function register_events(plugin: discord_plugin) {
	plugin.bot.on(GatewayDispatchEvents.Ready, () => {
		plugin.emit('ready');
	});
	plugin.bot.on(GatewayDispatchEvents.Resumed, () => {
		plugin.emit('ready');
	});
	plugin.bot.on(GatewayDispatchEvents.MessageCreate, msg => {
		plugin.emit('create_message', messageToCore(msg.api, msg.data));
	});
	plugin.bot.on(GatewayDispatchEvents.MessageUpdate, msg => {
		plugin.emit('edit_message', messageToCore(msg.api, msg.data));
	});
	plugin.bot.on(GatewayDispatchEvents.MessageDelete, msg => {
		plugin.emit('delete_message', {
			channel: msg.data.channel_id,
			id: msg.data.id,
			platform: { name: 'bolt-discord', message: msg },
			timestamp: Temporal.Instant.fromEpochMilliseconds(
				Number(BigInt(msg.data.id) >> 22n) + 1420070400000
			)
		});
	});
	plugin.bot.on(GatewayDispatchEvents.InteractionCreate, interaction => {
		if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
		const opts = {} as Record<string, string>;
		let subcmd = '';

		for (const opt of interaction.data.data.options || []) {
			if (opt.type === 1) subcmd = opt.name;
			if (opt.type === 3) opts[opt.name] = opt.value;
		}

		plugin.emit('create_command', {
			cmd: interaction.data.data.name,
			subcmd,
			replyfn: async msg => {
				await interaction.api.interactions.reply(
					interaction.data.id,
					interaction.data.token,
					await coreToMessage(msg)
				);
			},
			channel: interaction.data.channel.id,
			platform: 'bolt-discord',
			opts,
			timestamp: Temporal.Instant.fromEpochMilliseconds(
				Number(BigInt(interaction.data.id) >> 22n) + 1420070400000
			)
		});
	});
}
