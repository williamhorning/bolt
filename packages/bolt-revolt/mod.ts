import type {
  bridge_channel,
  Channel,
  Client,
  deleted_message,
  lightning,
  Member,
  Message,
  message,
  User,
} from './deps.ts';
import { createClient, plugin } from './deps.ts';
import { fromrvapi, torvapi } from './messages.ts';

export class revolt_plugin extends plugin<{ token: string }> {
	bot: Client;
	name = 'bolt-revolt';

  constructor(l: lightning, config: { token: string }) {
    super(l, config);
    this.bot = createClient(config);
    this.bot.bonfire.on('Message', async (message) => {
      if (message.system) return;
      this.emit('create_message', await fromrvapi(this.bot, message));
    });
    this.bot.bonfire.on('MessageUpdate', async (message) => {
      if (message.data.system) return;
      this.emit(
        'edit_message',
        await fromrvapi(this.bot, message.data as Message),
      );
    });
    this.bot.bonfire.on('MessageDelete', (message) => {
      this.emit('delete_message', {
        channel: message.channel,
        id: message.id,
        plugin: 'bolt-revolt',
        timestamp: Temporal.Now.instant(),
      });
    });
  }

  async create_bridge(channel: string) {
    const ch = await this.bot.api.request(
      'get',
      `/channels/${channel}`,
      undefined,
    ) as Channel;
    let perms_ok = false;
    if (ch.permissions) { if (ch.permissions & (1 << 28)) perms_ok = true; }
    if (ch.default_permissions) {
      if (ch.default_permissions.a & (1 << 28)) perms_ok = true;
    }
    if (ch.server && ch.role_permissions) {
      const { _id } = await this.bot.api.request(
        'get',
        `/users/@me`,
        undefined,
      ) as User;
      const me = await this.bot.api.request(
        'get',
        `/servers/${ch.server}/members/${_id}`,
        undefined,
      ) as Member;
      me.roles?.forEach((role) => {
        if (ch.role_permissions![role].a & (1 << 28)) perms_ok = true;
      });
    }
    if (!perms_ok) {
      throw new Error(
        "Can't bridge this channel! Enable masquerade permissions",
      );
    }
    return channel;
  }

  async create_message(
    msg: message,
    bridge: bridge_channel,
    _: undefined,
    reply_id?: string,
  ) {
    return (
      (await this.bot.api.request('post', `/channels/${bridge.id}/messages`, {
        ...(await torvapi(this.bot, { ...msg, reply_id })),
      })) as Message
    )._id;
  }

  async edit_message(
    msg: message,
    bridge: bridge_channel,
    edit_id: string,
    reply_id?: string,
  ) {
    await this.bot.api.request(
      'patch',
      `/channels/${bridge.id}/messages/${edit_id}`,
      {
        ...(await torvapi(this.bot, { ...msg, reply_id })),
      },
    );
    return edit_id;
  }

  async delete_message(_: deleted_message, bridge: bridge_channel, id: string) {
    await this.bot.api.request(
      'delete',
      `/channels/${bridge.id}/messages/${id}`,
      undefined,
    );
    return id;
  }
}
