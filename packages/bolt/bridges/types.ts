import { Bolt } from '../bolt.ts';
import { message } from '../utils/messages.ts';

export interface bridge_document {
	_id: string;
	platforms: bridge_platform[];
	settings?: {
		realnames?: boolean;
	};
}

export interface bridge_platform {
	channel: string;
	plugin: string;
	senddata: unknown;
	id?: string;
}

export interface bridge_message
	extends Omit<message<unknown>, 'replyto'>,
		Omit<bridge_platform, 'id'> {
	bolt: Bolt;
	bridgePlatform: bridge_platform;
	replytoId?: string;
}

export type bridge_message_arguments = {
	type: 'create';
	data: bridge_message;
};
