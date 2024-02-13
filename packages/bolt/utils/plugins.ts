import { Bolt } from '../bolt.ts';
import { bridge_platform, bridge_message_arguments } from '../bridges/mod.ts';
import { EventEmitter } from '../deps.ts';
import { command_arguments } from '../cmds/mod.ts';
import { message } from './messages.ts';

export abstract class bolt_plugin extends EventEmitter<plugin_events> {
	abstract name: string;
	abstract version: string;
	boltversion = '1';
	bridgeSupport?: {
		text?: boolean;
	} = {};
	abstract createSenddata(channel: string): Promise<unknown>;
	abstract bridgeMessage(
		data: bridge_message_arguments
	): Promise<bridge_platform>;
	abstract isBridged(data: message<unknown>): boolean | 'query';
	abstract start(bolt: Bolt): Promise<void> | void;
}

export type plugin_events = {
	msgcreate: [message<unknown>];
	commandCreate: [Omit<command_arguments, 'bolt'>];
	messageCreate: [message<unknown>];
	// deno-lint-ignore no-explicit-any
	error: [Error & { uuid?: string; e: Error; extra?: Record<string, any> }];
	warning: [string];
	ready: [unknown?];
	debug: [unknown];
};
