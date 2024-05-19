import type { lightning } from '../lightning.ts';
import { join, leave, reset, status, toggle } from './cmd_internals.ts';
import { exists } from './db_internals.ts';
import { handle_message } from './handle_message.ts';

export function setup_bridges(l: lightning) {
	l.on('create_message', async msg => {
		await new Promise(res => setTimeout(res, 15));
		if (await exists(l, `lightning-bridged-${msg.id}`)) return;
		l.emit(`create_nonbridged_message`, msg);
		handle_message(l, msg, 'create_message');
	});

	l.on('edit_message', async msg => {
		await new Promise(res => setTimeout(res, 15));
		if (await exists(l, `lightning-bridged-${msg.id}`)) return;
		handle_message(l, msg, 'edit_message');
	});

	l.on('delete_message', async msg => {
		await new Promise(res => setTimeout(res, 15));
		handle_message(l, msg, 'delete_message');
	});

	l.commands.set('bridge', {
		name: 'bridge',
		description: 'bridge this channel to somewhere else',
		execute: () => `Try running the help command for help with bridges`,
		options: {
			subcommands: [
				{
					name: 'join',
					description: 'join a bridge',
					execute: async opts => (await join(opts))[1],
					options: { argument_name: 'name', argument_required: true }
				},
				{
					name: 'leave',
					description: 'leave a bridge',
					execute: async opts => (await leave(opts))[1]
				},
				{
					name: 'reset',
					description: 'reset a bridge',
					execute: async opts => await reset(opts),
					options: { argument_name: 'name' }
				},
				{
					name: 'toggle',
					description: 'toggle a setting on a bridge',
					execute: async opts => await toggle(opts),
					options: { argument_name: 'setting', argument_required: true }
				},
				{
					name: 'status',
					description: 'see what bridges you are in',
					execute: async opts => await status(opts)
				}
			]
		}
	});
}
