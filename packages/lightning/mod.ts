/**
 * lightning is a typescript-based chatbot that supports
 * bridging multiple chat apps via plugins.
 * @module
 */

export * from './src/bridges/types.ts';
export type {
	command,
	command_arguments,
	command_options,
} from './src/commands.ts';
export * from './src/errors.ts';
export * from './src/lightning.ts';
export * from './src/messages.ts';
export * from './src/migrations.ts';
export * from './src/plugins.ts';
