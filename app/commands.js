import { parseArgs } from "./deps.js";

export class BoltCommands {
  commands = new Map();

  constructor(bolt) {
    this.bolt = bolt;
    this.bolt.on("msgcreate", (msg) => {
      if (msg.content?.startsWith("!bolt")) {
        let opts = parseArgs({
          args: msg.content.split(" "),
          strict: false,
        });
        opts.positionals.shift();
        this.runCommand({
          channel: msg.channel,
          cmd: opts.positionals.shift(),
          subcmd: opts.positionals.shift(),
          guild: msg.guild,
          opts: opts.values,
          platform: msg.platform,
          timestamp: msg.timestamp,
          replyfn: msg.reply,
        });
      }
    });
  }

  regusterCommands(...cmds) {
    for (const cmd of cmds) {
      this.commands.set(cmd.name, cmd);
      if (cmd.options?.default) this.fallback = cmd;
    }
  }

  async runCommand({
    cmd,
    subcmd,
    channel,
    platform,
    opts,
    timestamp,
    replyfn,
  }) {
    const command = this.commands.get(cmd) || this.fallback;
    let reply;
    try {
      let execute;
      if (command.options?.subcommamds && subcmd) {
        execute = command.options.subcommands.find((i) => i.name === subcmd);
      }
      if (!execute) execute = command;
      reply = await execute.execute({
        channel,
        platform,
        opts,
        timestamp,
        commands: this,
        bolt: this.bolt,
      });
    } catch (e) {
      reply = await this.bolt.logError(e, {
        cmd,
        subcmd,
        channel,
        platform,
        opts,
        timestamp,
      });
    }
    try {
      await replyfn(reply, false);
    } catch (e) {
      await this.bolt.logError(e, {
        cmd,
        subcmd,
        channel,
        platform,
        opts,
        timestamp,
      });
    }
  }
}
