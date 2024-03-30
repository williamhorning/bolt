import { GatewayDispatchEvents } from './deps.ts';
import { id_to_temporal, tocore, todiscord } from './messages.ts';
import { discord_plugin } from './mod.ts';

export function register_events(plugin: discord_plugin) {
	plugin.bot.on(GatewayDispatchEvents.Ready, () => {
		plugin.emit('ready');
	});
	plugin.bot.on(GatewayDispatchEvents.MessageCreate, async msg => {
		plugin.emit('create_message', await tocore(msg.api, msg.data));
	});
	plugin.bot.on(GatewayDispatchEvents.MessageUpdate, async msg => {
		plugin.emit('edit_message', await tocore(msg.api, msg.data));
	});
	plugin.bot.on(GatewayDispatchEvents.MessageDelete, async msg => {
		plugin.emit('delete_message', await tocore(msg.api, msg.data));
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
					await todiscord(msg, interaction.data.channel?.id || '')
				);
			},
			channel: interaction.data.channel.id,
			platform: 'bolt-discord',
			opts,
			timestamp: id_to_temporal(interaction.data.id)
		});
	});
}
