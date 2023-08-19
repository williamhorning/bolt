import { getBridges } from "../../bridge/utils.js";
import { boltEmbedMsg } from "../../utils.js";

export default {
	execute: async ({ channel, platform }) => {
		let { legacy: legacyBridgeId, current: thisbridge } = await getBridges({
			channel,
			platform,
		});
		console.log(await getBridges({ platform, channel }));
		return boltEmbedMsg(
			"Bolt Bridge status",
			`Here's what's going on with your bridge`,
			[
				{
					name: "bridge IDs",
					value: `The bridge ID is \`${legacyBridgeId}\` and the beta bridge ID is \`${thisbridge?._id}\``,
				},
			]
		);
	},
	metadata: {
		command: "status",
		description: "see what's going on with your bridge",
	},
};
