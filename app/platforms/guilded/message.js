export async function constructGuildedMsg(msgd) {
  let msg = Object.assign({}, msgd);
  let dat = {
    content:
      msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)") ||
      "*empty message*",
    username: chooseValidGuildedUsername(msg),
    avatar_url: msg.author.profile,
    embeds: [...(msg.embeds || [])],
  };
  if (msg.attachments?.length > 0) {
    dat.content += `${dat.content ? "\n" : ""}${msg.attachments
      ?.map((a) => {
        return `![${a.alt || a.name}](${a.file})`;
      })
      ?.join("\n")}`;
  }
  if (msg.replyto) {
    dat.embeds.push(
      ...[
        {
          author: {
            name: `reply to ${msg.replyto.author.username}`,
            icon_url: msg.replyto.author.profile,
          },
          description: msg.replyto.content,
        },
        ...(msg.replyto.embeds || []),
      ]
    );
  }
  if (dat.embeds.length !== 0) {
    dat.embeds.map((embed) => {
      for (let i in embed) {
        let item = embed[i];
        if (item == null || item == undefined) embed[i] = undefined;
      }
      delete embed.timestamp;
    });
  } else {
    delete dat.embeds;
  }
  let files = [];
  if (msg.attachments?.length > 0) {
    for (let i in msg.attachments) {
      let file = msg.attachments[i];
      files.push({
        name: file.name,
        content: await (await fetch(file.file)).arrayBuffer(),
      });
    }
  }
  return [dat, dat.embeds, files];
}

function chooseValidGuildedUsername(msg) {
  if (validUsernameCheck(msg.author.username)) {
    return msg.author.username;
  } else if (validUsernameCheck(msg.author.rawname)) {
    return msg.author.rawname;
  } else {
    return `user on ${msg.platform}`;
  }
}

function validUsernameCheck(username) {
  if (!username) return false;
  return (
    username.length > 1 &&
    username.length < 32 &&
    username.match(/^[a-zA-Z0-9_ ()]*$/gms)
  );
}

export async function constructmsg(message, guilded) {
  if (!message) return;
  if (!message.createdByWebhookId && message.authorId !== "Ann6LewA") {
    await guilded.members.fetch(message.serverId, message.authorId);
  }
  return {
    content: message.content?.replace(/\[(.*)\]\((.+)\)/g, "[$1]($2)"),
    author: {
      username: message.member?.displayName || message.author?.name,
      rawname: message?.author?.name,
      profile: message.author?.avatar,
      banner: message.author?.banner,
      id: message.authorId,
    },
    replyto: (message.replyMessageIds || [])[0]
      ? await getReply(message, guilded)
      : undefined,
    attachments: [], // guilded attachments suck and don't have a bot api impl
    embeds: message.raw.embeds,
    platform: "guilded",
    channel: message.channelId,
    guild: message.serverId,
    id: message.id,
    timestamp: message.createdAt.getTime(),
    reply: async (content) => {
      if (typeof content != "string")
        content = (await constructGuildedMsg(content))[0];
      return await message.reply(content);
    },
    webhookid: message.createdByWebhookId,
  };
}

async function getReply(message, guilded) {
  let msg2 = await guilded.messages.fetch(
    message.channelId,
    message.replyMessageIds[0]
  );
  if (!msg2) return;
  if (!msg2.createdByWebhookId) {
    await guilded.members.fetch(msg2.serverId, msg2.authorId);
  }
  return {
    content: msg2.content,
    author: {
      username:
        msg2.member?.displayName ||
        msg2.author?.name ||
        "user on guilded, probably",
      profile: msg2.author?.avatar,
    },
    embeds: msg2.raw.embeds,
  };
}
