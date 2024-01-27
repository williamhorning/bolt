export async function constructmsg(message, revolt) {
  let bg = (await message.author.fetchProfile()).background;
  let msg = {
    content: message.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
    author: {
      username:
        message.member?.nickname || message.author?.username || "revolt user",
      rawname: message.author.username || "revolt user",
      profile: message.author.avatarURL,
      banner: null,
      id: message.authorId,
    },
    replyto:
      message.replyIds?.length > 0
        ? await getReply(message, revolt)
        : undefined,
    attachments: await getAttachments(message),
    platform: "revolt",
    channel: message.channelId,
    guild: message.server?.id,
    id: message.id,
    timestamp: message.createdAt.getTime(),
    reply: async (content, masq) => {
      if (typeof content != "string")
        content = await constructRevoltMessage(content, masq);
      message.reply(content);
    },
    embeds: message.embeds?.filter((embed) => {
      if (embed.type !== "Image") return true;
    }),
    masquerade: message.masquerade,
  };
  if (bg) {
    msg.author.banner = `https://autumn.revolt.chat/backgrounds/${
      bg._id
    }/${encodeURI(bg.filename)}`;
  }
  return msg;
}

async function getReply(message, revolt) {
  let msg = await revolt.messages.fetch(message.channelId, message.replyIds[0]);
  if (!msg) return null;
  return {
    content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
    author: {
      username: msg.member?.nickname || msg.author.username,
      profile: msg.author.avatarURL,
    },
    embeds: msg.embeds,
  };
}
async function getAttachments(message) {
  return (
    message.attachments?.map((attachment) => {
      return {
        file: `https://autumn.revolt.chat/attachments/${
          attachment.id
        }/${encodeURI(attachment.filename)}`,
        alt: attachment.filename,
        spoiler: false,
        name: attachment.filename,
      };
    }) || []
  );
}

export async function constructRevoltMessage(msgd, masq = true) {
  let msg = Object.assign({}, msgd);
  return {
    content: msg.content?.replace(/!\[(.*)\]\((.+)\)/g, "[$1]($2)"),
    masquerade: masq
      ? {
          name: msg.author.username,
          avatar: msg.author.profile,
        }
      : undefined,
    attachments: await constructRevoltAttachments(msg),
    embeds: constructRevoltEmbeds(msg),
  };
}

function constructRevoltEmbeds(msg) {
  let embeds = msg.embeds?.map(mapEmbed) || [];
  if (msg.replyto) {
    const reply_embed = {
      title: `Replying to ${msg.replyto.author.username}'s message`,
      icon_url: msg.replyto.author.profile,
    };
    if (msg.replyto.content) reply_embed.description = msg.replyto.content;
    embeds.push(reply_embed, ...(msg.replyto.embeds?.map(mapEmbed) || []));
  }
  return embeds.length > 0 ? embeds : undefined;
}

async function constructRevoltAttachments(msg) {
  if (msg.attachments?.length > 0) {
    let attachments = [];
    for (let attachment of msg.attachments) {
      let formdat = new FormData();
      let req = await fetch(attachment.file);
      let blob = await req.blob();
      formdat.append("file", blob);
      let revoltrequest = await fetch(
        `https://autumn.revolt.chat/attachments`,
        {
          method: "POST",
          body: formdat,
        }
      );
      let revoltjson = await revoltrequest.json();
      if (!revoltjson.id) continue;
      await attachments.push(revoltjson.id);
    }
    return attachments;
  } else {
    return undefined;
  }
}

function mapEmbed(i) {
  if (i.fields) {
    for (let field of i.fields) {
      i.description += `\n**${field.name}**\n${field.value}\n`;
    }
    delete i.fields;
  }
  let data = {
    colour: i.color,
    url: i.url,
    description: i.description,
    title: i.description,
    iconUrl: i.icon_url,
    type: "Text",
    title: i.title,
  };
  return Object.fromEntries(Object.entries(data).filter(([_, v]) => v != null));
}
