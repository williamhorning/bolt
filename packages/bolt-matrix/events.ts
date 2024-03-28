import { message } from "lightning";
import { Intent, Request, WeakEvent } from "matrix";
import { matrix_plugin } from "./mod.ts";

export async function onEvent(
  this: matrix_plugin,
  request: Request<WeakEvent>,
) {
  const event = request.getData();
  const bot = this.bot.getBot();
  const intent = this.bot.getIntent();
  if (
    event.type === "m.room.member" &&
    event.content.membership === "invite" &&
    event.state_key === bot.getUserId()
  ) {
    try {
      await intent.join(event.room_id);
    } catch (e) {
      console.debug(`Failed to join room ${event.room_id}: ${e}`);
    }
  }
  if (event.type === "m.room.message" && !event.content["m.new_content"]) {
    this.emit(
      "create_message",
      await messageToCore(event, intent, this.config.homeserverUrl),
    );
  }
  if (event.type === "m.room.message" && event.content["m.new_content"]) {
    this.emit(
      "edit_message",
      await messageToCore(event, intent, this.config.homeserverUrl),
    );
  }
  if (event.type === "m.room.redaction") {
    this.emit("delete_message", {
      id: event.redacts as string,
      platform: { name: "bolt-matrix", message: event },
      channel: event.room_id,
      timestamp: Temporal.Instant.fromEpochMilliseconds(event.origin_server_ts),
    });
  }
}

export async function messageToCore(
  event: WeakEvent,
  intent: Intent,
  homeserverUrl: string,
): Promise<message<WeakEvent>> {
  const sender = await intent.getProfileInfo(event.sender);
  return {
    author: {
      username: sender.displayname || event.sender,
      rawname: event.sender,
      id: event.sender,
      profile: `${
        sender.avatar_url?.replace(
          "mxc://",
          `${homeserverUrl}/_matrix/media/v3/thumbnail/`,
        )
      }?width=96&height=96&method=scale`,
    },
    channel: event.room_id,
    id: event.content["m.relates_to"]?.rel_type == "m.replace"
      ? event.content["m.relates_to"].event_id
      : event.event_id,
    timestamp: Temporal.Instant.fromEpochMilliseconds(event.origin_server_ts),
    content: (event.content["m.new_content"]?.body ||
      event.content.body) as string,
    reply: async (msg: message<unknown>) => {
      await intent.sendMessage(event.room_id, coreToMessage(msg));
    },
    platform: { name: "bolt-matrix", message: event },
  };
}

export function coreToMessage(msg: message<unknown>) {
  return {
    body: msg.content
      ? msg.content
      : "*this bridge doesn't support anything except text at the moment*",
    msgtype: "m.text",
  };
}
