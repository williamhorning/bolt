# lightning-plugin-matrix

lightning-plugin-matrix is a plugin for
[lightning](https://williamhroning.eu.org/lightning) that adds support for
telegram

## example config

```ts
import type { config } from 'jsr:@jersey/lightning@0.7.3';
import { matrix_plugin } from 'jsr:@jersey/lightning-plugin-matrix@0.7.3';

export default {
	redis_host: 'localhost',
	redis_port: 6379,
	plugins: [
		matrix_plugin.new({
			appservice_id: 'lightning',
			appservice_token: 'your_creative_token',
			homeserver_domain: 'your.domain.tld',
			homeserver_localpart: 'bot.lightning',
			homeserver_prefix: 'lightning-',
			homeserver_url: 'https://matrix.your.domain.tld',
			homeservice_token: 'your_other_creative_token',
			plugin_port: 5555,
			plugin_url: 'https://lightning-matrix.your.domain.tld',
			registration_file: `/path/to/reg.yaml`,
			store_dir: `/path/to/storage_directory`,
		}),
	],
} as config;
```
