import type { message } from './types.ts';

/**
 * creates a message that can be sent using lightning
 * @param text the text of the message (can be markdown)
 */
export function create_message(text: string): message {
	const data = {
		author: {
			username: 'lightning',
			profile: 'https://williamhorning.eu.org/assets/lightning.png',
			rawname: 'lightning',
			id: 'lightning',
		},
		content: text,
		channel: '',
		id: '',
		reply: async () => {},
		timestamp: Temporal.Now.instant(),
		plugin: 'lightning',
	};
	return data;
}
