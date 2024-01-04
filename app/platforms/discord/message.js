export async function constructmsg({ data: message, api }, exclreply = false) {
  return {
    content: message.type === 20 ? "loading..." : message.content,
    author: {
      username:
        message.member?.nick || message.author?.username || "discord user",
      rawname: message.author?.username,
      profile: `https://cdn.discordapp.com/avatars/${message.author?.id}/${message.author?.avatar}.png`,
      id: message.author?.id || message.webhook_id || "",
    },
    replyto: message.referenced_message
      ? await getReply(message, api, exclreply)
      : undefined,
    attachments: message.attachments?.map((i) => {
      return {
        file: i.file,
        name: i.filename,
      };
    }),
    platform: "discord",
    channel: message.channel_id,
    guild: message.guild_id,
    id: message.id,
    timestamp: new Date(message.timestamp).getTime(),
    reply: async (content) => {
      await api.channels.createMessage(message.channel_id, {
        ...coreToMessage(content),
        message_reference: {
          message_id: message.id,
        },
      });
    },
    embeds: message.embeds?.map((i) => {
      return { ...i, timestamp: new Date(i.timestamp).getTime() };
    }),
    webhookid: message.webhook_id,
  };
}

async function getReply(message, api, exclreply) {
  if (!message.referenced_message || exclreply) return;
  try {
    return await constructmsg(
      { message: message.referenced_message, api },
      true
    );
  } catch {
    return;
  }
}

export function coreToMessage(msgd) {
  let msg = Object.assign({}, msgd);
  let content = msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)");
  if (content?.length == 0) content = null;
  let dscattachments = msg.attachments?.map((crossplat) => {
    return {
      attachment: crossplat.file,
      description: crossplat.alt,
      name: crossplat.name,
    };
  });
  let dat = {
    content,
    username: msg.author.username,
    avatar_url: msg.author.profile,
    files: dscattachments,
    embeds: [...(msg.embeds || [])],
  };
  if (msg.replyto) {
    dat.embeds.push({
      author: {
        name: `reply to ${msg.replyto.author.username}`,
        icon_url: msg.replyto.author.profile,
      },
      description: `${msg.replyto.content} `,
    });
    dat.embeds.push(...(msg.replyto.embeds || []));
  }
  return dat;
}
