export interface lightning_send_body {
	room_id: string;
	intent: string;
	messages: Record<string, unknown>[];
}

export interface lightning_delete_body {
	room_id: string;
	messages: string[];
}

export interface matrix_client_event {
	content: Record<string, unknown>;
	event_id: string;
	origin_server_ts: number;
	room_id: string;
	sender: string;
	state_key?: string;
	type: string;
}

export interface matrix_user {
	mxid: string;
	display_name?: string;
	avatar_url?: string;
	avatar_mxc?: string;
}

/** config for the matrix plugin */
export interface matrix_config {
	/** id used to identify the appservice on the homeserver */
	appservice_id: string;
	/** the url the plugin's server is accessable from */
	plugin_url: string;
	/** the port the plugin listens on */
	plugin_port: number;
	/** the prefix for bridged users (such as `lightning-`) */
	homeserver_prefix: string;
	/** the url where the homeserver is at */
	homeserver_url: string;
	/** the domain users on the homeservers are associated with */
	homeserver_domain: string;
}