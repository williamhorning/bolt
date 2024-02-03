ARG DENO_VERSION=v1.39.4

FROM docker.io/lukechannings/deno:${DENO_VERSION}

# add bolt to the image
WORKDIR /app
ADD . /app

# set bolt as the entrypoint and use the run command by default
CMD [ "deno", "run", "-A", "app/index.js"]
