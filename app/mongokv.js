import { MongoClient } from "mongodb";

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

	async put(key, value) {
		return (
			await this.collection.replaceOne(
				{ _id: key },
				{ _id: key, value: value },
				{ upsert: true }
			)
		).acknowledged;
	}

	async delete(key) {
		return (await this.collection.deleteOne({ _id: key })).acknowledged;
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

	async findWithMeta(query) {
		// this doesn't run on KV, and shouldn't
		let mongoquery = {};
		for (let i of Object.keys(query)) {
			if (i !== "_id") {
				mongoquery[`value.${i}`] = query[i];
			} else {
				mongoquery[i] = query[i];
			}
		}
		let data = await this.collection.findOne(mongoquery);
		return {
			_id: String(data?._id),
			value: data?.value,
		};
	}
}
