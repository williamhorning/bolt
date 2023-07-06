ARG DENO_VERSION=v1.34.3

FROM docker.io/lukechannings/deno:${DENO_VERSION}
VOLUME [ "/config" ]
WORKDIR /app
ADD ./packages/bolt /app
RUN deno cache /app/mod.ts
CMD [ "run", "-A", "--unstable", "mod.ts", "--", "run", "--config", "/data/config.ts"]
