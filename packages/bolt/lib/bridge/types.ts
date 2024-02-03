import { Bolt } from '../mod.ts';
import { BoltMessage, BoltMessageDelete, BoltThread } from '../types.ts';

export interface BoltBridgeDocument {
	_id: string;
	name: string;
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
	thread?: BoltThread;
}

export interface BoltBridgeMessage
	extends Omit<BoltMessage<unknown>, 'replyto'>,
		BoltBridgePlatform {
	bolt: Bolt;
	bridgePlatform: BoltBridgePlatform;
	replytoId?: string;
}

export interface BoltBridgeMessageDelete
	extends BoltMessageDelete<unknown>,
		BoltBridgePlatform {
	bolt: Bolt;
	bridgePlatform: BoltBridgePlatform;
}

export interface BoltBridgeThread extends BoltThread, BoltBridgePlatform {
	bridgePlatform: BoltBridgePlatform;
}

export type BoltBridgeMessageArgs = {
	type: 'create' | 'update' | 'delete';
	data: BoltBridgeMessage | BoltBridgeMessageDelete;
};

export type BoltBridgeThreadArgs = {
	type: 'create' | 'update' | 'delete';
	data: BoltBridgeThread;
};
