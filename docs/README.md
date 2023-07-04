# bolt

## bot invite links

- [Discord](https://discord.com/api/oauth2/authorize?client_id=946939274434080849&permissions=8&scope=bot)
- [Guilded](https://www.guilded.gg/b/9fc1c387-fda8-47cd-b5ec-2de50c03cd64)
- [Revolt](https://app.revolt.chat/bot/01G1Y9M6G254VWBF41W3N5DQY5)

## support servers

- [Discord](https://discord.gg/eGq7uhtJDx)
- [Guilded](https://www.guilded.gg/i/kamX0vek)
- [Revolt](https://app.revolt.chat/invite/tpGKXcqk)

## [changelog](/changelog.md)

## permissions

Bolt should get administrator permissions, so it can create webhooks and masquerade

## commands

### `!bolt help`

Links to this page alongside the support servers

### `!bolt ping`

Pings the bot and returns the latency

### `!bolt version`

Returns the version of the codebase that the bot is running

### `!bolt bridge status`

Shows the status of the bridges in the current channel

### `!bolt bridge legacy`

The current bridge system in Bolt, will eventually be migrated to a new system, hence the name

#### `!bolt bridge legacy --action=join --bridge=<name>`

Connects the current channel to a bridge named `<name>`. Do NOT use spaces in the name, try using dashes instead.

#### `!bolt bridge legacy --action=leave`

Leaves the current bridge
