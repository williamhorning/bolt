import dedent from "string-dedent";
import { MongoClient } from "mongodb";

export function boltError(area, areadesc, prod, e, noStackTrace = false) {
	let returnd = {
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
				\`\`\`
			`,
	};
	if (noStackTrace) {
		returnd.content = dedent`
			bolt ran into an issue.
			here's some info:
				**what you should do**
				join the support server:
					- https://discord.gg/eGq7uhtJDx
					- https://www.guilded.gg/i/kamX0vek
					or
					- https://app.revolt.chat/invite/tpGKXcqk
				**details**
				area: ${area} - ${areadesc}
				prod: ${prod}
				**error**
				error: ${e?.message || e}
				stack trace:
				see console
				\`\`\`
			`;
		console.log(e?.stack || e);
	}
	return returnd;
}

// todo: replace with an implementation that's mostly miniflare KV compatible
export class mongoWrapper {
	constructor(config = {}) {
		this.config = config;
	}
	async setup() {
		this.client = new MongoClient(
			this.config.connect || "mongodb://127.0.0.1:27017"
		);
		await this.client.connect();
		let dbname = this.config.prod ? "bolt" : "bolt-canary";
		this.db = this.client.db(dbname);
		this.collections = {
			bridgev1: this.db.collection("bridge"),
		};
	}
	async put(collection, key, value) {
		return await this.collections[collection].replaceOne(
			{
				_id: key,
			},
			{
				_id: key,
				value: value,
			},
			{
				upsert: true,
			}
		);
	}
	async get(collection, key) {
		return (
			await this.collections[collection].findOne({
				_id: key,
			})
		)?.value;
	}
	async delete(collection, key) {
		return await this.collections[collection].deleteOne({
			_id: key,
		});
	}
	async find(collection, query) {
		return (await this.collections[collection].findOne(query))?.value;
	}
	async getAll(collection, query = {}) {
		return (
			await (await this.collections[collection].find(query)).toArray()
		).map((x) => {
			return {
				_id: x._id,
				...x.value,
			};
		});
	}
}

export function argvParse(argstring) {
	let args = argstring.split(" ");
	args.shift();
	let returnData = {
		commands: [],
		arguments: {},
		commandString: '',
	};
	args.forEach((arg) => {
		let [argument, value] = arg.match(/([^=\s]+)=?\s*(.*)/).splice(1);
		if (argument.startsWith('--')) {
			if (!isNaN(parseFloat(value))) {
				value = parseFloat(value);
			} else if (value === 'true') {
				value = true;
			} else if (value === 'false') {
				value = false;
			} else if (value === '') {
				value = true;
			}
			returnData.arguments[argument.slice(2)] = value;
		} else {
			returnData.commands.push(argument);
		}
	});
	returnData.commandString = returnData.commands.join(' ');
	return returnData;
}
