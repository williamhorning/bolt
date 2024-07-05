/** channel within a bridge */
export interface bridge_channel {
	/** the id of this channel */
	id: string;
	/** the data needed to bridge this channel */
	data: unknown;
	/** the plugin used to bridge this channel */
	plugin: string;
}

/** bridged messages */
export interface bridge_message {
	/** the id of the message */
	id: string | string[];
	/** the id of the channel the message was sent in */
	channel: string;
	/** the plugin the message was sent using */
	plugin: string;
}

/** the representation of a bridge */
export interface bridge_document {
	/** whether or not to allow editing */
	allow_editing: boolean;
	/** the channels to be bridged */
	channels: bridge_channel[];
	/** the id of the bridge */
	id: string;
	/** messages bridged using these channels */
	messages?: bridge_message[];
	/** whether or not to use nicknames */
	use_rawname: boolean;
}
