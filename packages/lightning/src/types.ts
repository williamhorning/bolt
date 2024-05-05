import type { lightning } from './lightning.ts';
import type { plugin } from './plugins.ts';

/**
 * types used by lightning
 * @module
 */

/** attachments within a message */
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

/** channel within a bridge */
export interface bridge_channel<data_type = unknown> {
	/** the id of this channel */
	id: string;
	/** the data needed to bridge this channel */
	data: data_type;
	/** the plugin used to bridge this channel */
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
	messages?: string[];
	/** whether or not to use nicknames */
	use_rawname: boolean;
}

/** the way to make a plugin */
export interface create_plugin<
	plugin_type extends plugin<plugin_type['config']>
> {
	/** the actual constructor of the plugin */
	type: new (l: lightning, config: plugin_type['config']) => plugin_type;
	/** the configuration options for the plugin */
	config: plugin_type['config'];
	/** what version the plugin supports */
	support: string;
}

/** configuration options for bolt */
export interface config {
	/** a list of plugins */
	// deno-lint-ignore no-explicit-any
	plugins: create_plugin<any>[];
	/** the prefix used for commands */
	cmd_prefix?: string;
	/** the set of commands to use */
	commands?: [string, command][];
	/** the hostname of your redis instance */
	redis_host: string;
	/** the port of your redis instance */
	redis_port?: number;
	/** the webhook used to send errors to */
	errorURL?: string;
}

/** arguments passed to a command */
export interface command_arguments {
	/** the name of the command */
	cmd: string;
	/** the subcommand being run, if any */
	subcmd?: string;
	/** the channel its being run in */
	channel: string;
	/** the platform its being run on */
	platform: string;
	/** timestamp given */
	timestamp: Temporal.Instant;
	/** options passed by the user */
	opts: Record<string, string>;
	/** the function to reply to the command */
	reply: (message: message<unknown>, optional?: unknown) => Promise<void>;
}

/** options when parsing a command */
export interface command_options {
	/** this will be the key passed to options.opts in the execute function */
	argument_name?: string;
	/** whether or not the argument provided is required */
	argument_required?: boolean;
	/** an array of commands that show as subcommands */
	subcommands?: command[];
}

/** commands are a way for users to interact with the bot */
export interface command {
	/** the name of the command */
	name: string;
	/** an optional description */
	description?: string;
	/** options when parsing the command */
	options?: command_options;
	/** a function that returns a message */
	execute: (options: command_arguments) => Promise<string> | string;
}

/** a representation of a message that has been deleted */
export interface deleted_message<platform_message> {
	/** the message's id */
	id: string;
	/** the channel the message was sent in */
	channel: string;
	/** the platform the message was sent on */
	platform: platform<platform_message>;
	/**
	 * the time the message was sent/edited as a temporal instant
	 * @see https://tc39.es/proposal-temporal/docs/instant.html
	 */
	timestamp: Temporal.Instant;
}

/** the author of an embed */
export interface embed_author {
	/** the name of the author */
	name: string;
	/** the url of the author */
	url?: string;
	/** the icon of the author */
	icon_url?: string;
}

/** a field within an embed */
export interface embed_field {
	/** the name of the field */
	name: string;
	/** the value of the field */
	value: string;
	/** whether or not the field is inline */
	inline?: boolean;
}

/** the footer of an embed */
export interface embed_footer {
	/** the footer text */
	text: string;
	/** the icon of the footer */
	icon_url?: string;
}

/** media inside of an embed */
export interface embed_media {
	/** the height of the media */
	height?: number;
	/** the url of the media */
	url: string;
	/** the width of the media */
	width?: number;
}

/** a discord-style embed */
export interface embed {
	/** the author of the embed */
	author?: embed_author;
	/** the color of the embed */
	color?: number;
	/** the text in an embed */
	description?: string;
	/** fields within the embed */
	fields?: embed_field[];
	/** a footer shown in the embed */
	footer?: embed_footer;
	/** an image shown in the embed */
	image?: embed_media;
	/** a thumbnail shown in the embed */
	thumbnail?: embed_media;
	/** the time (in epoch ms) shown in the embed */
	timestamp?: number;
	/** the title of the embed */
	title?: string;
	/** a site linked to by the embed */
	url?: string;
	/** a video inside of the embed */
	video?: Omit<embed_media, 'url'> & { url?: string };
}

/** the error returned from log_error */
export interface err {
	/** the original error */
	e: Error;
	/** the cause of the error */
	cause: unknown;
	/** extra information about the error */
	extra: Record<string, unknown>;
	/** the uuid associated with the error */
	uuid: string;
	/** the message associated with the error */
	message: message<unknown>;
}

/** the author of a message */
export interface message_author {
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
}

/** a message recieved by a plugin */
export interface message<platform_message>
	extends deleted_message<platform_message> {
	/** the attachments sent with the message */
	attachments?: attachment[];
	/** the author of the message */
	author: message_author;
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
	/** a function to translate a document */
	translate: (data: [string, unknown][]) => [string, unknown][];
}

/** the platform that recieved a message */
export interface platform<message_type> {
	/** the name of a plugin */
	name: string;
	/** the platforms representation of a message */
	message: message_type;
	/** the webhook the message was sent with */
	webhookid?: string;
}

/** the events emitted by a plugin */
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
};

/** all of the versions with migrations to/from them */
export enum versions {
	/** versions 0.5 through 0.6 */
	Five = '0.5',
	/** versions 0.7 and above*/
	Seven = '0.7'
}
