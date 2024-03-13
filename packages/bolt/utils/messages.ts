export function create_message({
	text,
	uuid
}: {
	text?: string;
	uuid?: string;
}): message<undefined> & { uuid?: string } {
	const data = {
		author: {
			username: 'Bolt',
			profile:
				'https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024',
			rawname: 'bolt',
			id: 'bolt'
		},
		content: text,
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Temporal.Now.instant(),
		platform: {
			name: 'bolt',
			message: undefined
		},
		uuid
	};
	return data;
}

export type embed_media = { height?: number; url: string; width?: number };

export interface embed {
	author?: { name: string; url?: string; icon_url?: string };
	color?: number;
	description?: string;
	fields?: { name: string; value: string; inline?: boolean }[];
	footer?: { text: string; icon_url?: string };
	image?: embed_media;
	thumbnail?: embed_media;
	timestamp?: number;
	title?: string;
	url?: string;
	video?: Omit<embed_media, 'url'> & { url?: string };
}

export interface message<t> {
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
	embeds?: embed[];
	reply: (message: message<unknown>, optional?: unknown) => Promise<void>;
	replytoid?: string;
	id: string;
	platform: {
		name: string;
		message: t;
		webhookid?: string;
	};
	channel: string;
	timestamp: Temporal.Instant;
}

export interface deleted_message<t> {
	id: string;
	channel: string;
	platform: {
		name: string;
		message: t;
	};
	timestamp: Temporal.Instant;
}
