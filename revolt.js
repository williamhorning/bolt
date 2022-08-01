import { Client as RevoltClient } from "revolt.js";
import EventEmitter from "events";
import parse from "./argv.js";

class revoltClient extends EventEmitter {
	constructor(token) {
		super();
		this.revolt = new RevoltClient();
		this.revolt.on("ready", () => {
			this.emit("ready");
		});
		this.revolt.on("message", async (message) => {
			// TODO: implement the bot, but revolt
		});
		this.revolt.loginBot(token);
	}
}

export default revoltClient;