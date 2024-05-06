import { EventEmitter, RedisClient, parseArgs } from '../deps.ts';
import { bridges } from './bridges/mod.ts';
import type { plugin } from './plugins.ts';
import type {
	command,
	command_arguments,
	config,
	create_plugin,
	plugin_events
} from './types.ts';
import { create_message, log_error } from './utils.ts';

/** an instance of lightning */
export class lightning extends EventEmitter<plugin_events> {
	/** the bridge system */
	bridges: bridges;
	/** the commands registered */
	commands: Map<string, command>;
	/** the config used */
	config: config;
	/** a redis client */
	redis: RedisClient;
	/** the plugins loaded */
	plugins: Map<string, plugin<unknown>> = new Map<string, plugin<unknown>>();

	/** setup an instance with the given config and redis connection */
	constructor(config: config, redis_conn: Deno.TcpConn) {
		super();
		this.config = config;
		this.commands = new Map(config.commands);
		this.redis = new RedisClient(redis_conn);
		this.listen_commands();
		this.bridges = new bridges(this);
		this.load(this.config.plugins);
	}

	/** load plugins */
	load(plugins: create_plugin<plugin<unknown>>[]) {
		let unsupported = 0;
		for (const p of plugins) {
			if (p.support !== '0.7.0') {
				unsupported++;
				continue;
			} else {
				const plugin = new p.type(this, p.config);
				this.plugins.set(plugin.name, plugin);
				(async () => {
					for await (const event of plugin) {
						this.emit(event.name, ...event.value);
					}
				})();
			}
		}
		if (unsupported > 0) {
			log_error(
				new Error(
					`${unsupported} of you plugins aren't supported by lightning and weren't loaded`
				)
			);
		}
	}

	private listen_commands() {
		const prefix = this.config.cmd_prefix || 'l!';

		this.on('create_nonbridged_message', m => {
			if (!m.content?.startsWith(prefix)) return;

			const {
				_: [cmd, subcmd],
				...opts
			} = parseArgs(m.content.replace(prefix, '').split(' '));

			this.run_command({
				cmd: cmd as string,
				subcmd: subcmd as string,
				opts,
				channel: m.channel,
				plugin: m.plugin,
				reply: m.reply,
				timestamp: m.timestamp
			});
		});
	}

	/** run a command */
	async run_command(args: command_arguments) {
		let reply;

		try {
			const cmd = this.commands.get(args.cmd) || this.commands.get('help')!;

			const exec =
				cmd.options?.subcommands?.find(i => i.name === args.subcmd)?.execute ||
				cmd.execute;

			reply = await exec(args);
		} catch (e) {
			reply = (await log_error(e, { ...args, reply: undefined })).message;
		}

		try {
			await args.reply(
				typeof reply == 'string' ? create_message(reply) : reply,
				false
			);
		} catch (e) {
			await log_error(e, { ...args, reply: undefined });
		}
	}
}
