/** the database's representation of a bridge */
export interface bridge_document {
	/** the bridge's id */
	_id: string;
	/** each platform within the bridge */
	platforms: bridge_platform[];
	/** the settings for the bridge */
	settings?: bridge_settings;
}

/** platform within a bridge */
export interface bridge_platform {
	/** the channel to be bridged */
	channel: string;
	/** the plugin used for this platform */
	plugin: string;
	/** the data needed for a message to be sent */
	senddata: unknown;
	/** the id of a sent message */
	id?: string;
}

/** bridge settings */
export interface bridge_settings {
	/** use an authors rawname instead of username */
	realnames?: boolean;
	/** whether or not to allow editing to be bridged */
	editing_allowed?: boolean;
}
