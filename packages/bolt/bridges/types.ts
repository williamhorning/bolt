export interface bridge_document {
	_id: string;
	platforms: bridge_platform[];
	settings?: {
		realnames?: boolean;
		editing_allowed?: boolean;
	};
}

/** platform within a bridge */
export interface bridge_platform {
	channel: string;
	plugin: string;
	senddata: unknown;
	id?: string;
}
