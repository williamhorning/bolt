import { parseArgs } from '../deps.ts';
import type { lightning } from '../lightning.ts';
import type { command_arguments } from './types.ts';
import { log_error } from './utils.ts';

export function setup_commands(l: lightning) {
	const cmds = new Map(l.config.commands);
	const prefix = l.config.cmd_prefix || 'l!';

	async function run(o: command_arguments) {
		let reply;

		try {
			const cmd = cmds.get(o.cmd) || cmds.get('help')!;

			const exec =
				cmd.options?.subcommands?.find(i => i.name === o.subcmd)?.execute ||
				cmd.execute;
			
			reply = await exec(o);
		} catch (e) {
			reply = (await log_error(e, { ...o, reply: undefined })).message;
		}

		try {
			await o.reply(reply, false);
		} catch (e) {
			await log_error(e, { ...o, reply: undefined });
		}
	}

	l.on('add_command', i => cmds.set(i.name, i));

	l.on('create_command', run);

	l.on('create_nonbridged_message', m => {
		if (!m.content?.startsWith(prefix)) return;

		const {
			_: [cmd, subcmd],
			...opts
		} = parseArgs(m.content.replace(prefix, '').split(' '));

		run({ ...m, cmd: cmd as string, subcmd: subcmd as string, opts });
	});
}
