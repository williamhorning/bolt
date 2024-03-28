import { EventEmitter } from "event";
import { bridge_platform } from "../bridges/types.ts";
import { lightning } from "../lightning.ts";
import { command_arguments } from "./commands.ts";
import { deleted_message, message } from "./messages.ts";

/**
 * a plugin for lightning
 */
export abstract class plugin<cfg> extends EventEmitter<plugin_events> {
  /** access the instance of lightning you're connected to */
  lightning: lightning;
  /** access the config passed to you by lightning */
  config: cfg;

  /** the name of your plugin */
  abstract name: string;
  /** the version of your plugin */
  abstract version: string;
  /** a list of major versions supported by your plugin, should include 0.5.5 */
  abstract support: string[];

  /** create a new plugin instance */
  static new<T extends plugin<unknown>>(
    this: new (l: lightning, config: T["config"]) => T,
    config: T["config"],
  ): create_plugin<T> {
    return { type: this, config };
  }
  constructor(l: lightning, config: cfg) {
    super();
    this.lightning = l;
    this.config = config;
  }

  /** this should return the data you need to send to the channel given */
  abstract create_bridge(channel: string): Promise<unknown>;

  /** this is used to bridge a NEW message */
  abstract create_message(
    message: message<unknown>,
    bridge: bridge_platform,
  ): Promise<bridge_platform>;

  /** this is used to bridge an EDITED message */
  abstract edit_message(
    new_message: message<unknown>,
    bridge: bridge_platform & { id: string },
  ): Promise<bridge_platform>;

  /** this is used to bridge a DELETED message */
  abstract delete_message(
    message: deleted_message<unknown>,
    bridge: bridge_platform & { id: string },
  ): Promise<bridge_platform>;
}

export type plugin_events = {
  /** when a message is created */
  create_message: [message<unknown>];
  /** when a command is run (not a text command) */
  create_command: [Omit<command_arguments, "commands">];
  /** when a message isn't already bridged (don't emit outside of core) */
  create_nonbridged_message: [message<unknown>];
  /** when a message is edited */
  edit_message: [message<unknown>];
  /** when a message is deleted */
  delete_message: [deleted_message<unknown>];
  /** when your plugin is ready */
  ready: [];
};

/** the constructor for a plugin */
export interface create_plugin<T extends plugin<T["config"]>> {
  type: new (l: lightning, config: T["config"]) => T;
  config: T["config"];
}
