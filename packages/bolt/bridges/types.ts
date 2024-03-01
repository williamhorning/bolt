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
