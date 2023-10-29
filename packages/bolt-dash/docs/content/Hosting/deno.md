# Deno

Deno isn't the way you should run in production as you want to add an extra
layer between Bolt and the host. Deno Deploy also doesn't work with Bolt, so try
using [Docker](./docker.md) or a VM in a production environment.

## Prerequisites

- [Deno >=1.37.2](https://deno.land)
- [Git (when running from source)](https://git-scm.com)
- [MongoDB >=4](https://www.mongodb.com/docs/manual/installation/)
- [Redis (optional)](https://redis.io/docs/getting-started/installation/)

## Getting started

Clone the Bolt Github repository from
`https://github.com/williamhorning/bolt.git` and open a terminal in that folder.

If you want to use a stable version, run the following:

```sh
git switch 0.5.3
```

Then, you will probably want to install the Bolt CLI using the following:

```sh
deno install -A --name bolt ./packages/bolt/mod.ts
```

If you are developing locally though or if you want to be able to make
modifications, replace `bolt` with
`deno run -A path/to/bolt/packages/bolt/mod.ts ...`

Then take some time to [configure your bolt instance](./configure.md) and
[run any necessary DB migrations](./database.md). After all of that, run
`bolt run` to start Bolt.
