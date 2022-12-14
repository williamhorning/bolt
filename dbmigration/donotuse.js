import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { Client as rvl } from "revolt.js";

let mongo = new MongoClient('mongodb://localhost:27017')

await mongo.connect()

let bridgeRAW = mongo.db('bolt-canary').collection('bridge');
let bridgev1RAW = mongo.db('bolt-canary').collection('bridgev1');

// we need to go through each record in bridgeraw and add it to bridgev1 in the new format
// find a list of bridges, these are the `{platform}-{name}` keys

let bridgeRAWList = await bridgeRAW.find({}).toArray();

// revolt client

let revoltClient = new rvl();

await revoltClient.loginBot(process.env.REVOLT_TOKEN);

bridgeRAWList = bridgeRAWList.filter((a) => {
  if (a._id.match(/^(discord|guilded|revolt)-/)) {
    let [platform, channelorname] = a._id.split('-');
    // check if channelorname is a channel or a name
    // do this by checking the value
    if (typeof a.value === 'string') {
      // it's a channel, probably, unless platform is revolt
      if (platform !== 'revolt') {
        return false
      } else {
        return !revoltClient.channels.exists(channelorname)
      }
    } else {
      return true;
    }
  } else {
    return true;
  }
})

// log bridges

let obj = {}

for (let bridge of bridgeRAWList) {
  let [platform, name] = bridge._id.split('-');
  let [_, ...rest] = (await bridgeRAW.findOne({ _id: { $regex: `${platform}-.*` }, value: name }))?._id.split("-");
  let channel = rest.join('-')
  let newthing = {
    platform,
    channel,
    senddata: bridge.value
  }
  console.log(`Migrating ${platform}-${name} to bridgev1. Channel ID: ${channel}`)
  if (!obj[`brige-${name}`]) {
    obj[`bridge-${name}`] = {
      value: {
        bridges: []
      }
    }
  }
  obj[`bridge-${name}`].value.bridges.push(newthing)
}

console.log(obj)

// for each key, add it to bridgev1

for (let key in obj) {
  await bridgev1RAW.replaceOne({ _id: key }, obj[key], { upsert: true })
}