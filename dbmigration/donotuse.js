import 'dotenv/config';
import { MongoClient } from 'mongodb';
import isChannel, { destroy } from './isChannel.js';

let mongo = new MongoClient('mongodb://localhost:27017')

await mongo.connect()

let bridgeRAW = mongo.db('bolt').collection('bridge');
let bridgev1RAW = mongo.db('bolt').collection('bridgev1new');

// we need to go through each record in bridgeraw and add it to bridgev1 in the new format
// find a list of bridges, these are the `{platform}-{name}` keys

let bridgeRAWList = await bridgeRAW.find({}).toArray();

let obj = {}

for (let bridge of bridgeRAWList) {
  let [platform, ...join] = bridge._id.split('-');
  let name = join.join('-');
  if (await isChannel(platform, name)) { continue };
  console.log(`Migrating ${platform}-${name} to bridgev1`)
  let _id = (await bridgeRAW.findOne({ _id: { $regex: `${platform}-.*` }, value: name }))?._id;
  if (!_id) {
    console.log(`No channel found?`)
    continue;
  }
  if (!obj[`bridge-${name}`]) obj[`bridge-${name}`] = []
  let [_, ...rest] = _id.split('-');
  let channel = rest.join('-')
  let newthing = {
    platform,
    channel,
    senddata: bridge.value
  }
  obj[`bridge-${name}`].push(newthing)
  console.log(`Added ${platform}-${channel} to bridge-${name}`)
}

console.log(obj)

// for each key, add it to bridgev1
for (let key in obj) {
  await bridgev1RAW.replaceOne({ _id: key }, {
    value: {
      bridges: obj[key]
    }
  }, { upsert: true })
}

destroy()
await mongo.close()