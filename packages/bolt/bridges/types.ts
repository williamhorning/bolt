import { message, Bolt } from './_deps.ts';

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

export interface bridge_message extends Omit<message<unknown>, 'replyto'> {
	bolt: Bolt;
	bridgePlatform: bridge_platform;
	replytoId?: string;
}

export type bridge_message_arguments = {
	type: 'create';
	data: bridge_message;
};
