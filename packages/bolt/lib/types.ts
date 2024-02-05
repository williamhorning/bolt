type BoltMediaEmbed = {
	url: string;
	proxy_url?: string;
	height?: number;
	width?: number;
};

export interface BoltEmbed {
	author?: {
		name: string;
		url?: string;
		iconUrl?: string;
		proxy_icon_url?: string;
	};
	color?: number;
	description?: string;
	fields?: {
		name: string;
		value: string;
		inline?: boolean;
	}[];
	footer?: {
		text: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	image?: BoltMediaEmbed;
	provider?: {
		name?: string;
		url?: string;
	};
	thumbnail?: BoltMediaEmbed;
	timestamp?: number;
	title?: string;
	url?: string;
	video?: {
		url?: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
}

export interface BoltMessage<Message> {
	attachments?: {
		alt?: string;
		file: string;
		name?: string;
		spoiler?: boolean;
		size: number;
	}[];
	author: {
		username: string;
		rawname: string;
		profile?: string;
		banner?: string;
		id: string;
		color?: string;
	};
	content?: string;
	embeds?: BoltEmbed[];
	reply: (message: BoltMessage<unknown>, optional?: unknown) => Promise<void>;
	replyto?: Omit<BoltMessage<unknown>, 'replyto'>;
	id: string;
	platform: {
		name: string;
		message: Message;
		webhookid?: string;
	};
	channel: string;
	guild?: string;
	threadId?: string;
	timestamp: number;
}

export type BoltPluginEvents = {
	msgcreate: [BoltMessage<unknown>];
	messageCreate: [BoltMessage<unknown>];
	error: [Error];
	warning: [string];
	ready: [unknown?];
	debug: [unknown];
};
