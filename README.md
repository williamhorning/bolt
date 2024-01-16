# Bolt 0.4.x

## Hosting

### Prerequisites

- Node.js 21 or higher or Docker Compose
- MongoDB hosted on localhost:27017 OR the address provided in MONGO_URI
- A Discord, Revolt, and Guilded bot with the token and client ID accessible

### Running

1. Clone the repository
2. Setup `.env` to contain the following:

```sh
# discord
DISCORD_TOKEN = ""
DISCORD_CLIENTID = ""
# guilded
GUILDED_TOKEN = ""
# revolt
REVOLT_TOKEN = ""
# mongodb
MONGO_URI = ""
MONGO_DB = ""
# error handling
ERROR_HOOK = "webhook.goes.here"
```

3. Install dependencies
4. Run the app with either Docker Compose or Node
5. Run `app/platforms/discord/commands.js` to register slash commands
