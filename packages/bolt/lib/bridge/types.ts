import { Bolt, BoltMessage } from './deps.ts';

export interface BoltBridgeDocument {
	_id: string;
	platforms: BoltBridgePlatform[];
	settings?: {
		realnames?: boolean;
	};
}

export interface BoltBridgePlatform {
	channel: string;
	plugin: string;
	senddata: unknown;
}

export interface BoltBridgeSentPlatform extends BoltBridgePlatform {
	id: string;
}

export interface BoltBridgeMessage
	extends Omit<BoltMessage<unknown>, 'replyto'>,
		BoltBridgePlatform {
	bolt: Bolt;
	bridgePlatform: BoltBridgePlatform;
	replytoId?: string;
}

export type BoltBridgeMessageArgs = {
	data: BoltBridgeMessage;
};
