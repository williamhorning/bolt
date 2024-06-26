export interface matrix_client_event {
	content: Record<string, unknown>;
	event_id: string;
	origin_server_ts: number;
	room_id: string;
	sender: string;
	state_key?: string;
	type: string;
	unsigned?: matrix_unsigned_data;
}

export interface matrix_unsigned_data {
	age?: number;
	membership?: string;
	prev_content?: Record<string, unknown>;
	redacted_because?: matrix_client_event;
	transaction_id?: string;
}

export interface matrix_user {
	display_name?: string;
	avatar_url?: string;
	avatar_mxc?: string;
}

export interface matrix_config {
	/** token used to authenticate to the homeserver */
	appservice_token: string;
	/** token used to authenticate to the plugin */
	homeservice_token: string;
	/** id used to identify the appservice on the homeserver */
	appservice_id: string;
	/** the username of the bot on the homeserver */
	homeserver_localpart: string;
	/** the url the plugin's server is accessable from */
	plugin_url: string;
	/** the port the plugin listens on */
	plugin_port: number;
	/** the prefix for bridged users (such as `lightning-`) */
	homeserver_prefix: string;
	/** the path to store the registration file */
	registration_file: string;
	/** the path to store the user store */
	store_dir: string;
	/** the url where the homeserver is at */
	homeserver_url: string;
	/** the domain users on the homeservers are associated with */
	homeserver_domain: string;
}