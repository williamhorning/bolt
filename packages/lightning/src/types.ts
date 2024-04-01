import type { Document } from '../deps.ts';
import type { lightning } from '../lightning.ts';
import type { commands } from './commands.ts';
import type { plugin } from './plugins.ts';

export interface attachment {
	/** alt text for images */
	alt?: string;
	/** a URL pointing to the file */
	file: string;
	/** the file's name */
	name?: string;
	/** whether or not the file has a spoiler */
	spoiler?: boolean;
	/** file size */
	size: number;
}

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

/** the constructor for a plugin */
export interface create_plugin<T extends plugin<T['config']>> {
	type: new (l: lightning, config: T['config']) => T;
	config: T['config'];
}

export interface config {
	/** a list of plugins */
	// deno-lint-ignore no-explicit-any
	plugins: create_plugin<any>[];
	/** the prefix used for commands */
	cmd_prefix?: string;
	/** the set of commands to use */
	commands?: [string, command][];
	/** the URI that points to your instance of mongodb */
	mongo_uri: string;
	/** the database to use */
	mongo_database: string;
	/** the hostname of your redis instance */
	redis_host: string;
	/** the port of your redis instance */
	redis_port?: number;
	/** the webhook used to send errors to */
	errorURL?: string;
}

export interface command_arguments {
	channel: string;
	cmd: string;
	opts: Record<string, string>;
	platform: string;
	replyfn: message<unknown>['reply'];
	subcmd?: string;
	timestamp: Temporal.Instant;
	commands: commands;
}

export interface command {
	/** the name of the command */
	name: string;
	/** an optional description */
	description?: string;
	options?: {
		/** this will be the key passed to options.opts in the execute function */
		argument_name?: string;
		/** whether or not the argument provided is required */
		argument_required?: boolean;
		/** an array of commands that show as subcommands */
		subcommands?: command[];
	};
	/** a function that returns a message */
	execute: (
		options: command_arguments
	) => Promise<message<unknown>> | message<unknown>;
}

export interface deleted_message<t> {
	/** the message's id */
	id: string;
	/** the channel the message was sent in */
	channel: string;
	/** the platform the message was sent on */
	platform: platform<t>;
	/**
	 * the time the message was sent/edited as a temporal instant
	 * @see https://tc39.es/proposal-temporal/docs/instant.html
	 */
	timestamp: Temporal.Instant;
}

export interface embed_media {
	height?: number;
	url: string;
	width?: number;
}

/** a discord-style embed */
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

export interface err {
	e: Error;
	cause: unknown;
	extra: Record<string, unknown>;
	uuid: string;
	message: message<unknown>;
}

export interface message<t> extends deleted_message<t> {
	attachments?: attachment[];
	author: {
		/** the nickname of the author */
		username: string;
		/** the author's username */
		rawname: string;
		/** a url pointing to the authors profile picture */
		profile?: string;
		/** a url pointing to the authors banner */
		banner?: string;
		/** the author's id on their platform */
		id: string;
		/** the color of an author */
		color?: string;
	};
	/** message content (can be markdown) */
	content?: string;
	/** discord-style embeds */
	embeds?: embed[];
	/** a function to reply to a message */
	reply: (message: message<unknown>, optional?: unknown) => Promise<void>;
	/** the id of the message replied to */
	replytoid?: string;
}

/** the type of a migration */
export interface migration {
	/** the version to translate from */
	from: versions;
	/** the version to translate to */
	to: versions;
	/** the database to translate from */
	from_db: string;
	/** the database to translate to */
	to_db: string;
	/** translate a document from one version to another */
	translate: (data: Document[]) => Document[];
}

export interface platform<t> {
	/** the name of a plugin */
	name: string;
	/** the platforms representation of a message */
	message: t;
	/** the webhook the message was sent with */
	webhookid?: string;
}

export type plugin_events = {
	/** when a message is created */
	create_message: [message<unknown>];
	/** when a command is run (not a text command) */
	create_command: [Omit<command_arguments, 'commands'>];
	/** when a message isn't already bridged (don't emit outside of core) */
	create_nonbridged_message: [message<unknown>];
	/** when a message is edited */
	edit_message: [message<unknown>];
	/** when a message is deleted */
	delete_message: [deleted_message<unknown>];
	/** when your plugin is ready */
	ready: [];
};
/** all of the versions with migrations to/from them */
export enum versions {
	/** all versions below 0.5 */
	Four = '0.4',
	/** versions after commit 7de1cf2 but below 0.5 */
	FourBeta = '0.4-beta',
	/** versions 0.5 and above */
	Five = '0.5'
}
