import {
  AppServiceRegistration,
  Bolt,
  Bridge,
  bridge_platform,
  Buffer,
  existsSync,
  MatrixUser,
  message,
  plugin,
} from "./deps.ts";
import { coreToMessage, onEvent } from "./events.ts";

type MatrixConfig = {
  appserviceUrl: string;
  homeserverUrl: string;
  domain: string;
  port?: number;
  reg_path: string;
};

export class matrix_plugin extends plugin<MatrixConfig> {
  bot: Bridge;
  name = "bolt-matrix";
  version = "0.5.6";
  support = ["0.5.5"];

  constructor(bolt: Bolt, config: MatrixConfig) {
    super(bolt, config);
    this.bot = new Bridge({
      homeserverUrl: this.config.homeserverUrl,
      domain: this.config.domain,
      registration: this.config.reg_path,
      controller: {
        onEvent: onEvent.bind(this),
      },
      roomStore: "./db/roomStore.db",
      userStore: "./db/userStore.db",
      userActivityStore: "./db/userActivityStore.db",
    });
    if (!existsSync(this.config.reg_path)) {
      const reg = new AppServiceRegistration(this.config.appserviceUrl);
      reg.setAppServiceToken(AppServiceRegistration.generateToken());
      reg.setHomeserverToken(AppServiceRegistration.generateToken());
      reg.setId(AppServiceRegistration.generateToken());
      reg.setProtocols(["bolt"]);
      reg.setRateLimited(false);
      reg.setSenderLocalpart("bot.bolt");
      reg.addRegexPattern("users", `@bolt-.+_.+:${this.config.domain}`, true);
      reg.outputAsYaml(this.config.reg_path);
    }
    this.bot.run(this.config.port || 8081);
  }

  // deno-lint-ignore require-await
  async create_bridge(channelId: string) {
    return channelId;
  }

  is_bridged(_msg: message<unknown>) {
    // TODO: implement this
    return true;
  }

  async create_message(
    msg: message<unknown>,
    platform: bridge_platform,
    edit = false,
  ) {
    const room = platform.senddata as string;
    const name = `@${platform.plugin}_${msg.author.id}:${this.config.domain}`;
    const intent = this.bot.getIntent(name);
    // check for profile
    await intent.ensureProfile(msg.author.username);
    const store = this.bot.getUserStore();
    let storeUser = await store?.getMatrixUser(name);
    if (!storeUser) {
      storeUser = new MatrixUser(name);
    }
    if (storeUser?.get("avatar") != msg.author.profile) {
      storeUser?.set("avatar", msg.author.profile);
      const b = await (await fetch(msg.author.profile || "")).blob();
      const newMxc = await intent.uploadContent(
        Buffer.from(await b.arrayBuffer()),
        { type: b.type },
      );
      await intent.ensureProfile(msg.author.username, newMxc);
      await store?.setMatrixUser(storeUser);
    }
    // now to our message
    const message = coreToMessage(msg);
    let editinfo = {};
    if (edit) {
      editinfo = {
        "m.new_content": message,
        "m.relates_to": {
          rel_type: "m.replace",
          event_id: msg.id,
        },
      };
    }
    const result = await intent.sendMessage(room, {
      ...message,
      ...editinfo,
    });
    return {
      channel: room,
      id: result.event_id,
      plugin: "bolt-matrix",
      senddata: room,
    };
  }

  async edit_message(
    msg: message<unknown>,
    platform: bridge_platform & { id: string },
  ) {
    return await this.create_message(msg, platform, true);
  }

  async delete_message(
    _msg: message<unknown>,
    platform: bridge_platform & { id: string },
  ) {
    const room = platform.senddata as string;
    const intent = this.bot.getIntent();
    await intent.botSdkIntent.underlyingClient.redactEvent(
      room,
      platform.id,
      "bridge message deletion",
    );
    return {
      channel: room,
      id: platform.id,
      plugin: "bolt-matrix",
      senddata: room,
    };
  }
}
