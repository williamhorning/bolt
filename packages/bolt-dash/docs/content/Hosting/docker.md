# Docker

Docker is the recommended way to run Bolt and is what we use for the hosted
version documented [here](../Using/index.md).

## Prerequisites

- [Docker >=20.10.21](https://docker.io)
- [Docker Compose >=2](https://docs.docker.com/compose/install/)

## Getting started

On your server, make a new folder and create a `docker-compose.yml` file similar
to the one below:

```yaml
version: '2'
services:
  bolt:
    image: williamfromnj/bolt:0.5.0
    volumes:
      - ./config:/app/data
    restart: always
  mongo:
    image: mongo:6-jammy
    ports:
      - 27017:27017
    volumes:
      - ./db:/data/db
    restart: always
  redis:
    image: redis:6.2-alpine
    ports:
      - 6379:6379
    volumes:
      - ./redis:/data
    restart: always
```

You may want to change the paths data are stored in by modifying the volumes
entry under each of the services. Once you've setup that, you can
[configure your bolt instance](./configure.md). When using the above setup, data
is stored in the `./config` directory. You must set `database.mongo` to
`mongodb://mongo:27017` and `database.redis` to the following:

```ts
{
	hostname: 'redis';
}
```

Then, you should [run any necessary DB migrations](./database.md). Run
`docker compose up` to start Bolt.

## Accessing the Bolt CLI

Instead of running `bolt` to access the Bolt CLI, you should use the following:

```sh
docker compose exec bolt ...
```

## Running from source

To run Bolt from source, clone the Bolt Github repository from
`https://github.com/williamhorning/bolt.git`, move your `docker-compose.yml`
file to that folder, and change the image line under the Bolt service to the
following:

```yml
services:
  bolt:
    build: .
    # ...
```

## Forwarding ports used by plugins

To forward ports required by plugins like `bolt-matrix`, add the necessary ports
to a ports key in your compose file.
