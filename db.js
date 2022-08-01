import { MongoClient } from 'mongodb';

class Database {
	constructor() {}
	async setup() {
		this.client = new MongoClient('mongodb://127.0.0.1:27017');
		await this.client.connect();
		this.db = this.client.db('bolt');
		this.collections = {
			bridgev1: this.db.collection('bridge'),
		};
	}
	async put(collection, key, value) {
		return await this.collections[collection].insertOne({
			_id: key,
			value: value,
		});
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
	async upsert(collection, key, value) {
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

export { Database };