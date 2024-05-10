# @jersey/lightning

lightning is a Typescript-based chatbot that supports bridging multiple chat
apps via plugins.

## [docs](https://williamhorning.dev/bolt)

## example config

```ts
import type { config } from 'jsr:@jersey/lightning@0.7.0';
import { discord_plugin } from 'https://williamhorning.dev/bolt/x/bolt-discord/0.7.0/mod.ts';

export default {
	redis_host: 'localhost',
	redis_port: 6379,
	plugins: [
		discord_plugin.new({
			// ...
		})
	]
} as config;
```
