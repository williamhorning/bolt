import { boltEmbedMsg, platforms, legacyBridgeDatabase, bridgeDatabase, getBridges } from "../utils.js";

export default async function bridge(
	msg,
	arg
) {
  let { legacy: legacyBridgeId, current: thisbridge } = await getBridges(msg);
	if (!arg._[0] || arg._[0] === "help") {
		msg.reply(
			boltEmbedMsg(
				"Bolt Bridges",
				"Bridges are a cool part of bolt that let you bridge messages between platforms. To get started, take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md)"
			)
		);
	} else if (arg._[0] === "legacy") {
		if (thisbridge) {
			msg.reply(
				boltEmbedMsg(
					"Bolt Bridges (legacy)",
					"Please use the API or dash to configure non-legacy bridges."
				)
			);
		}
		if (!arg._[1] || arg._[1] === "help") {
			msg.reply(
				boltEmbedMsg(
					"Bolt Bridges (legacy)",
					"This is the bridge system from the old Bridge Bot. If you figure it out without help you'd be the first. Take a look at the [docs ](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md#legacy) if you want to figure it out."
				)
			);
		} else if (arg._[1] === "join") {
			if (legacyBridgeId) {
				msg.reply(
					boltEmbedMsg("Bolt Bridges (legacy)", "You're already in a bridge!")
				);
			}
			if (arg._[2] === msg.channel) {
				msg.reply(
					boltEmbedMsg(
						"Bolt Bridges (legacy)",
						"You can't name a bridge using the channel ID!"
					)
				);
			}
			await legacyBridgeDatabase.put(
				`${msg.platform}-${msg.channel}`,
				arg._[2]
			);
			if (msg.platform == "discord") {
				let webhook = await msg["platform.message"].channel.createWebhook(
					"bridge"
				);
				await legacyBridgeDatabase.put(`${msg.platform}-${arg._[2]}`, {
					id: webhook.id,
					token: webhook.token,
				});
			}
			if (msg.platform == "guilded") {
				let { webhook } =
					await platforms.guilded.guilded.rest.router.createWebhook(msg.guild, {
						name: "bridge",
						channelId: msg.channel,
					});
				await legacyBridgeDatabase.put(`${msg.platform}-${arg._[2]}`, {
					id: webhook.id,
					token: webhook.token,
				});
			}
			if (msg.platform == "revolt") {
				await legacyBridgeDatabase.put(
					`${msg.platform}-${arg._[2]}`,
					msg.channel
				);
			}
			await msg.reply(boltEmbedMsg("Bolt Bridges (legacy)", "Joined bridge!"));
		} else if (arg._[1] === "leave") {
			if (!legacyBridgeId) {
				msg.reply(boltEmbedMsg("Bolt Bridges (legacy)", "No bridge is setup."));
			}

			await legacyBridgeDatabase.delete(
				`${msg.platform}-${bridgeIdentifierLegacy}`
			);

			await legacyBridgeDatabase.delete(`${msg.platform}-${msg.channel}`);

			msg.reply(
				boltEmbedMsg(
					"Bolt Bridges (legacy)",
					"Left bridge. If you have any feedback, join one of the support servers:\n - [discord](https://discord.gg/eGq7uhtJDx)\n- [guilded](https://www.guilded.gg/i/kamX0vek)\n - [revolt](https://app.revolt.chat/invite/tpGKXcqk)"
				)
			);
		} else {
			msg.reply(
				boltEmbedMsg(
					"Bolt Bridges (legacy)",
					"Invalid subcommand. Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md#legacy)"
				)
			);
		}
	} else {
		msg.reply(
			boltEmbedMsg(
				"Bolt Bridges",
				"Invalid subcommand. Take a look at the [docs](https://github.com/williamhorning/bolt/blob/main/docs/bridges.md)"
			)
		);
	}
}
