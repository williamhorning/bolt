import { Client as dsc, Intents as DiscordIntents } from "discord.js";
import { Client as rvl } from "revolt.js";
import { Client as gld } from "guilded.js";

let dscClient = new dsc({
  intents: Object.values(DiscordIntents.FLAGS),
})
let rvlClient = new rvl();
let gldClient = new gld({ token: process.env.GUILDED_TOKEN });

dscClient.login(process.env.DISCORD_TOKEN);
rvlClient.loginBot(process.env.REVOLT_TOKEN);
gldClient.login();

export default async function isChannel(platform, channelId) {
  if (platform === 'discord') {
    try {
      await dscClient.channels.fetch(channelId)
      return true;
    } catch (e) {
      return false;
    }
  } else if (platform === 'revolt') {
    return rvlClient.channels.exists(channelId);
  } else if (platform === 'guilded') {
    try {
      await gldClient.channels.fetch(channelId);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export function destroy() {
  dscClient.destroy();
  rvlClient.reset();
  gldClient.disconnect();
}