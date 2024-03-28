/**
 * creates a message that can be sent using lightning
 * @param text the text of the message (can be markdown)
 */
export function create_message(text: string): message<undefined> {
  const data = {
    author: {
      // TODO: make this configurable
      username: "Bolt",
      profile:
        "https://cdn.discordapp.com/icons/1011741670510968862/2d4ce9ff3f384c027d8781fa16a38b07.png?size=1024",
      rawname: "lightning",
      id: "lightning",
    },
    content: text,
    channel: "",
    id: "",
    reply: async () => {},
    timestamp: Temporal.Now.instant(),
    platform: {
      name: "lightning",
      message: undefined,
    },
  };
  return data;
}

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

export interface platform<t> {
  /** the name of a plugin */
  name: string;
  /** the platforms representation of a message */
  message: t;
  /** the webhook the message was sent with */
  webhookid?: string;
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
  video?: Omit<embed_media, "url"> & { url?: string };
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
