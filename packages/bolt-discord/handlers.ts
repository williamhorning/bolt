import { Bolt, GatewayDispatchEvents } from './deps.ts';
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
		// TODO: redo this
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
			cmd: interaction.data.data.name,
			replyfn: async msg => {
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
