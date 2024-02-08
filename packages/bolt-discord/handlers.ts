import {
	Bolt,
	GatewayDispatchEvents,
	ApplicationCommandOptionType
} from './deps.ts';
import { coreToMessage, messageToCore } from './messages.ts';
import { default as DiscordPlugin } from './mod.ts';

export function registerEvents(plugin: DiscordPlugin, bolt: Bolt) {
	plugin.bot.on(GatewayDispatchEvents.Ready, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.Resumed, ready => {
		plugin.emit('ready', ready.data);
	});
	plugin.bot.on(GatewayDispatchEvents.MessageCreate, async message =>
		plugin.emit('messageCreate', await messageToCore(message.api, message.data))
	);
	plugin.bot.on(GatewayDispatchEvents.InteractionCreate, async interaction => {
		if (interaction.data.type !== 2 || interaction.data.data.type !== 1) return;
		const opts = {} as Record<string, string>;
		let subcmd = '';

		for (const opt of interaction.data.data.options || []) {
			if (opt.type === ApplicationCommandOptionType.Subcommand)
				subcmd = opt.name;
			if (opt.type === ApplicationCommandOptionType.String)
				opts[opt.name] = opt.value;
		}

		await bolt.cmds.runCommand({
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
			timestamp: new Date(
				Number(BigInt(interaction.data.id) >> 22n) + 1420070400000
			).getTime()
		});
	});
}
