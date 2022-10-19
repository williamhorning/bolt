import dedent from "string-dedent";
import { MongoClient } from "mongodb";

export function boltError(area, areadesc, prod, e) {
	return {
		author: {
			username: "Bolt",
			icon_url:
				"https://cdn.discordapp.com/avatars/946939274434080849/fdcd9f72ed1f42e9ff99698a0cbf38fb.webp?size=128",
		},
		content: dedent`
			bolt ran into an issue.
			here's some info:
			\`\`\`md
				# what you should do
				join the support server:
					- https://discord.gg/eGq7uhtJDx
					- https://www.guilded.gg/i/kamX0vek
					or
					- https://app.revolt.chat/invite/tpGKXcqk
				# details
				area: ${area} - ${areadesc}
				prod: ${prod}
				# error
				error: ${e?.message || e}
				stack trace:
				${e?.stack || e}
				legal:
				https://github.com/williamhorning/bolt/blob/main/legalese.md
			\`\`\`
		`,
	};
}

export class mongoKV {
	constructor(
		mongo_opts = {
			url: "mongodb://localhost:27017",
			db: "kv",
			collection: "kv",
		}
	) {
		/**
		 * @internal
		 **/
		this._mongo = new MongoClient(mongo_opts.url);
		this._mongo.connect();
		/**
		 * @internal
		 **/
		this._db = this._mongo.db(mongo_opts.db);
		this.collection = this._db.collection(mongo_opts.collection);
	}

	async get(key) {
		return (
			await this.collection.findOne({
				_id: key,
			})
		)?.value;
	}

	async getWithMetadata(key) {
		return {
			_id: key,
			value: await this.collection.findOne({
				_id: key,
			}),
			metadata: data?.metadata,
		};
	}

	async put(key, value, opts) {
		await this.collection.replaceOne(
			{ _id: key },
			{ _id: key, value: value, metadata: opts?.metadata },
			{ upsert: true }
		);
	}

	async delete(key) {
		await this.collection.deleteOne({ _id: key });
	}

	async list(prefix = "", limit = 1000) {
		return {
			keys: this.collection
				.find({ _id: { $regex: prefix } })
				.limit(limit)
				.toArray()
				.map((x) => x._id),
		};
	}

	async getAll(prefix = ".*") {
		// this doesn't run on KV
		let data = {};
		for (let i of await this.collection
			.find({ _id: { $regex: prefix } })
			.toArray()) {
			data[i._id] = i.value;
		}
		return data;
	}

	async getAllWithMetadata(prefix) {
		// this doesn't run on KV
		let data = {};
		for (let i of await this.collection
			.find({ _id: { $regex: prefix } })
			.toArray()) {
			data[i._id] = i;
		}
		return data;
	}

	async find(query) {
		// this doesn't run on KV, and shouldn't
		let mongoquery = {};
		for (let i of Object.keys(query)) {
			if (i !== "_id") {
				mongoquery[`value.${i}`] = query[i];
			} else {
				mongoquery[i] = query[i];
			}
		}
		return (await this.collection.findOne(mongoquery))?.value;
	}
}

export function argvParse(argstring) {
	let args = argstring.split(" ");
	args.shift();
	let returnData = {
		commands: [],
		arguments: {},
		commandString: "",
	};
	args.forEach((arg) => {
		let [argument, value] = arg.match(/([^=\s]+)=?\s*(.*)/).splice(1);
		if (argument.startsWith("--")) {
			if (!isNaN(parseFloat(value))) {
				value = parseFloat(value);
			} else if (value === "true") {
				value = true;
			} else if (value === "false") {
				value = false;
			} else if (value === "") {
				value = true;
			}
			returnData.arguments[argument.slice(2)] = value;
		} else {
			returnData.commands.push(argument);
		}
	});
	returnData.commandString = returnData.commands.join(" ");
	return returnData;
}
