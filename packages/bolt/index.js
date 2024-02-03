import DiscordPlugin from '../bolt-discord/index.js';
import GuildedPlugin from '../bolt-guilded/index.js';
import RevoltPlugin from '../bolt-revolt/index.js';
import { Bolt } from './bolt.js';
import { defaultcommands } from './default_commands.js';
import { process, config } from './deps.js';

config();

const bot = new Bolt();

process.on('uncaughtException', e => bot.logFatalError(e));
process.on('unhandledRejection', e => bot.logFatalError(e));

bot.cmd.regusterCommands(...defaultcommands);

await bot.load(DiscordPlugin, GuildedPlugin, RevoltPlugin);

await bot.run();
