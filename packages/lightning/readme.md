# @jersey/lightning

lightning is a typescript-based chatbot that supports bridging multiple chat
apps via plugins

## [docs](https://williamhorning.eu.org/bolt)

## example config

```ts
import type { config } from 'jsr:@jersey/lightning@0.7.4';
import { discord_plugin } from 'jsr:@jersey/lightning-plugin-discord@0.7.4';

export default {
	redis_host: 'localhost',
	redis_port: 6379,
	plugins: [
		discord_plugin.new({
			// ...
		}),
	],
} as config;
```
