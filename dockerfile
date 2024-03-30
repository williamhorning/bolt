ARG DENO_VERSION=1.42.0

FROM docker.io/denoland/deno:${DENO_VERSION}

# add lightning to the image
WORKDIR /app
# TODO: change when repos split
ADD ./packages/lightning /app
RUN deno install -A --unstable-temporal -n lightning /app/cli.ts

# set lightning as the entrypoint and use the run command by default
ENTRYPOINT [ "lightning" ]
CMD [ "--run", "--config", "./data/config.ts"]
