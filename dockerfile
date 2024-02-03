ARG DENO_VERSION=v1.39.4

FROM docker.io/lukechannings/deno:${DENO_VERSION}

# add bolt to the image
WORKDIR /app

# set bolt as the entrypoint and use the run command by default
# TODO: switch this once merge done
CMD [ "deno", "run", "-A", "app/index.js"]
