import EventEmitter from "node:events";

export default class BasePlugin extends EventEmitter {
	constructor({ token }) {
		super();
		this.token = token;
	}
	async createSenddata(channel) {
		return;
	}
	async bridgeSend(msg, senddata, masq) {
		return {
			channel: "",
			platform: "",
			message: "",
		};
	}
}
