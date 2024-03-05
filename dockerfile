ARG DENO_VERSION=v1.40.4

FROM docker.io/lukechannings/deno:${DENO_VERSION}

# add bolt to the image
WORKDIR /app
ADD ./packages/bolt /app
RUN deno install -A --unstable-temporal -n bolt /app/cli.ts

# set bolt as the entrypoint and use the run command by default
ENTRYPOINT [ "bolt" ]
CMD [ "--run", "--config", "data/config.ts"]
