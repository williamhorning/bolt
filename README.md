# bolt

## docs

looking for bolt docs? check out [the docs](/docs/README.md), this readme is for the bolt codebase itself.

## setup

### prerequisites

- Node.js 19 or higher
- NPM 8 or higher
- MongoDB on localhost:27017
- A Discord, Revolt, and Guilded bot with the token and client ID accessible

### steps

1. Clone the repository
2. Run `npm install` to install dependencies
3. Setup `.env` to contain the following:

```sh
DISCORD_TOKEN = "token.goes.here"
DISCORD_CLIENTID = "clientid.goes.here"
GUILDED_TOKEN = "token.goes.here"
REVOLT_TOKEN = "token.goes.here"
ERROR_HOOK = "webhook.goes.here"
```

4. Run `node app/registerSlashCommands.js` to register the slash commands
5. Run `node app/index.js` or `docker-compose up` to start the bot
