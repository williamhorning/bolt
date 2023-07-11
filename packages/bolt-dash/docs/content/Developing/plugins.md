# Developing plugins

Bolt Plugins allow you to extend the functionality of Bolt by supplying support
for another platform or by introducing new commands. To create a plugin, export
an implementation of the `BoltPlugin` class.

## Example:

```ts
import {
	createBoltMessage,
	BoltPlugin,
	Bolt
} from 'https://bolt.williamhorning.dev/x/bolt/0.5.0/mod.ts'; // TODO: add final path

export default class ExamplePlugin extends BoltPlugin {
	name = 'example';
	version = '1.0.0';
	bridgeSupport = {
		text: true,
		threads: true,
		forum: false,
		voice: false
	};
	commands = [
		{
			name: 'ping',
			description: 'pong',
			execute({ timestamp }) {
				return createBoltMessage({
					content: `Pong! 🏓 ${Date.now() - timestamp}ms`
				});
			}
		}
	];
	async start(bolt: Bolt) {
		bolt.on('event', () => {});
	}
}
```
