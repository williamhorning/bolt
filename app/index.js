import "dotenv/config";
import DiscordPlugin from "./platforms/discord/index.js";
import GuildedPlugin from "./platforms/guilded/index.js";
import RevoltPlugin from "./platforms/revolt/index.js";
import Bolt from "./bolt.js";
import { defaultcommands } from "./default_commands.js";
import process from "node:process";

let bot = new Bolt();

process.on("uncaughtException", (e) => bot.logFatalError(e));
process.on("unhandledRejection", (e) => bot.logFatalError(e));

bot.cmd.regusterCommands(...defaultcommands);

await bot.load(DiscordPlugin, GuildedPlugin, RevoltPlugin);

await bot.run();
