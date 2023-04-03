import { boltEmbedMsg } from "../../utils.js";
import { getBridges } from "../../bridge/utils.js";

export default {
	execute: async (channel, platform) => {
		let bridge = await getBridges({
			channel,
			platform,
		});
		return boltEmbedMsg(
			"Bolt Bridge status",
			`Here's what's going on with your bridge`,
			[
				{
					name: "bridge IDs",
					value: `The bridge ID is \`${bridge?._id}\``,
				},
        {
          name: "places bridged to",
          value: `This bridge is bridged to ${bridge?.bridges?.length - 1} other places`
        }
			]
		);
	},
	metadata: {
		command: "status",
		description: "see what's going on with your bridge",
	},
};
