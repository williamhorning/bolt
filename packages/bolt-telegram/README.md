# lightning-plugin-telegram

lightning-plugin-telegram is a plugin for [lightning](https://williamhroning.eu.org/lightning)
that adds support for telegram

## example config

```ts
import type { config } from 'jsr:@jersey/lightning@0.7.3';
import { telegram_plugin } from 'jsr:@jersey/lightning-plugin-telegram@0.7.3';

export default {
	redis_host: 'localhost',
	redis_port: 6379,
	plugins: [
		discord_plugin.new({
			bot_token: "your_token",
			plugin_port: 8080,
			plugin_url: 'https://your.domain/telegram/',
		}),
	],
} as config;
```

## notes

this plugin has a telegram file proxy, which should be publically accessible so that you don't leak your bot token when bridging attachments or profile pictures