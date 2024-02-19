import {
	Bolt,
	EventEmitter,
	command_arguments,
	bridge_message_arguments,
	bridge_platform
} from './_deps.ts';
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
	ready: [unknown?];
	debug: [unknown];
};
