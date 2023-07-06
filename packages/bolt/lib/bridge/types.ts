import { BoltMessage, BoltMessageDelete, BoltThread } from '../types.ts';

export interface BoltBridgeDocument {
	_id: string;
	name: string;
	platforms: BoltBridgePlatform[];
}

export interface BoltBridgePlatform {
	channel: string;
	plugin: string;
	senddata: unknown;
}

export interface BoltBridgeSentPlatform extends BoltBridgePlatform {
	id: string;
	thread?: BoltThread;
}

export interface BoltBridgeMessage
	extends Omit<BoltMessage<unknown>, 'replyto'>,
		BoltBridgePlatform {
	bridgePlatform: BoltBridgePlatform;
	replytoId?: string;
}

export interface BoltBridgeMessageDelete
	extends BoltMessageDelete<unknown>,
		BoltBridgePlatform {
	bridgePlatform: BoltBridgePlatform;
}

export interface BoltBridgeThread extends BoltThread, BoltBridgePlatform {
	bridgePlatform: BoltBridgePlatform;
}

export type BoltBridgeMessageArgs = {
	event:
		| 'messageCreate'
		| 'threadMessageCreate'
		| 'messageUpdate'
		| 'threadMessageUpdate'
		| 'messageDelete';
	data: BoltBridgeMessage | BoltBridgeMessageDelete;
};

export type BoltBridgeThreadArgs = {
	event: 'threadCreate' | 'threadDelete';
	data: BoltBridgeThread;
};
