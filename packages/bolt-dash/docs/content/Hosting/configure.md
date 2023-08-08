# Configuring Bolt

## `config.ts`

Bolt looks for a `config.ts` file in either the `--config` option passed to the
run command or in the current directory, exiting if it can't find one or parse
it. The format of `config.ts` is similar to `vite.config.ts` as it also uses a
default export and allows you to use a helper function.

## Example

```ts
import { defineBoltConfig } from 'https://bolt.williamhorning.dev/x/bolt/0.5.1/mod.ts';
import bolt_discord from 'https://bolt.williamhorning.dev/x/bolt-discord/0.5.1/mod.ts';

export default defineBoltConfig({
	plugins: [
		new bolt_discord({
			token: 'woah',
			appId: 'example'
		})
	],
	database: {
		mongo: 'mongodb://localhost:27017',
		redis: {
			hostname: 'redis'
		}
	},
	http: {
		apiURL: 'http://bolt.localhost:8080'
	},
	prod: false
});
```

## Options

### prod

Tells Bolt whether or not it should use the prod DB collection.

### http.apiURL

Tells Bolt where the API is exposed. Currently unused.

### http.dashURL

Tells Bolt where the dashboard/docs site is located.

### http.errorURL

A Discord-compatible webhook to send errors to.

### database.mongo

A MongoDB connection URL or
[ConnectOptions](https://deno.land/x/mongo@v0.31.2/mod.ts?s=ConnectOptions)

### database.redis

[RedisConnectOptios](https://deno.land/x/redis@v0.29.2/mod.ts?s=RedisConnectOptions)

### plugins

An array of BoltPlugins
