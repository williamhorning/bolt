ARG DENO_VERSION=v1.36.0

FROM docker.io/lukechannings/deno:${DENO_VERSION}

# a mountpoint for data
RUN mkdir /data
VOLUME /data

# add bolt to the image
WORKDIR /app
ADD ./packages/bolt /app
RUN deno install --allow-all -n bolt /app/mod.ts

# set bolt as the entrypoint and use the run command by default
ENTRYPOINT [ "bolt" ]
CMD [ "run", "--config", "/data/config.ts"]
