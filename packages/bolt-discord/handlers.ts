import { GatewayDispatchEvents, ApplicationCommandOptionType } from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';
import { default as DiscordPlugin } from './mod.ts';

export function registerEvents(plugin: DiscordPlugin) {
	plugin.bot.on(GatewayDispatchEvents.Ready, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.Resumed, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.MessageCreate, async message =>
		plugin.emit('messageCreate', await messageToCore(message.api, message.data))
	);
	plugin.bot.on(GatewayDispatchEvents.InteractionCreate, interaction => {
		if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
		const opts = {} as Record<string, string>;
		let subcmd = '';

		for (const opt of interaction.data.data.options || []) {
			if (opt.type === ApplicationCommandOptionType.Subcommand)
				subcmd = opt.name;
			if (opt.type === ApplicationCommandOptionType.String)
				opts[opt.name] = opt.value;
		}

		plugin.emit('commandCreate', {
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
