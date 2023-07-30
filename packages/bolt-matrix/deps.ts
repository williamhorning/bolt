export { existsSync } from 'https://deno.land/std@0.192.0/fs/mod.ts';
export {
	AppServiceRegistration,
	Bridge,
	Intent,
	Request,
	type ClientEncryptionSession,
	type WeakEvent
} from 'npm:matrix-appservice-bridge@8.1.0';
export {
	BoltPlugin,
	type BoltBridgeMessageArgs,
	type BoltMessage
} from '../bolt/mod.ts';
