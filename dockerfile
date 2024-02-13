ARG DENO_VERSION=v1.39.4

FROM docker.io/lukechannings/deno:${DENO_VERSION}

# add bolt to the image
WORKDIR /app
ADD ./packages /app
RUN deno install -A -n bolt /app/packages/bolt-cli/mod.ts

# set bolt as the entrypoint and use the run command by default
ENTRYPOINT [ "bolt" ]
CMD [ "run", "--config", "data/config.ts"]
