# Deno

Deno isn't the way you should run in production as you want to add an extra
layer between Bolt and the host. Deno Deploy also doesn't work with Bolt, so try
using [Docker](./docker.md) or a VM in a production environment.

## Prerequisites

- [Deno >=1.35](https://deno.land)
- [Git (when running from source)](https://git-scm.com)
- [MongoDB >=4](https://www.mongodb.com/docs/manual/installation/)
- [Redis (optional)](https://redis.io/docs/getting-started/installation/)

## Getting started

Install the Bolt CLI using the following:

```sh
deno install -A --unstable https://bolt.williamhorning.dev/x/bolt/0.5.0/mod.ts
```

After that, you should [configure your bolt instance](./configure.md) and
[run any necessary DB migrations](./database.md). Run `bolt run` to start Bolt.

## Getting started (from source)

Clone the Bolt Github repository from
`https://github.com/williamhorning/bolt.git` and open a terminal in that folder.
Then take some time to [configure your bolt instance](./configure.md) and
[run any necessary DB migrations](./database.md). After all of that, run
`deno run -A --unstable ./packages/bolt/mod.ts run` to start Bolt.
