import DiscordPlugin from "./platforms/discord/index.js";
import GuildedPlugin from "./platforms/guilded/index.js";
import RevoltPlugin from "./platforms/revolt/index.js";

export const version = "0.4.13";

export const platforms = {
  discord: new DiscordPlugin({
    token: process.env.DISCORD_TOKEN,
  }),
  guilded: new GuildedPlugin({
    token: process.env.GUILDED_TOKEN,
  }),
  revolt: new RevoltPlugin({
    token: process.env.REVOLT_TOKEN,
  }),
};

export async function logError(e, extra = {}, usewebhook = true) {
  let uuid = crypto.randomUUID();
  console.error(`\x1b[41mBolt Error:\x1b[0m`);
  console.error("uuid:", uuid);
  console.error(e);
  console.error(extra);

  if (process.env.ERROR_HOOK && usewebhook) {
    delete extra.msg;
    await fetch(process.env.ERROR_HOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: `${e.message}`,
            description: `\`\`\`${e.stack}\`\`\`\n\`\`\`json\n${JSON.stringify(
              { ...extra, uuid },
              null,
              2
            )}\`\`\``,
          },
        ],
      }),
    });
  }

  return createMsg(
    `Error: ${e.message}`,
    `Try running \`!bolt help\` to get help.\n\`\`\`${uuid}\n\`\`\``
  );
}

export async function logFatalError(e) {
  await logError(e, { note: "this is a fatal error, exiting" });
  process.exit(1);
}

export function createMsg(title, description) {
  return {
    author: {
      username: "Bolt",
      profile:
        "https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024",
    },
    embeds: [{ title, description }],
  };
}
