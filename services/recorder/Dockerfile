# docker image build instructions
#
# to build image,
#   docker build --tag imagefoo .
# to run image as a container,
#   docker run -it --init --rm --name containerfoo imagefoo
#
# keep in synch with other Dockerfiles - meter, recorder, relay.
#
# see https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds
# and https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/

# not sure we need two stages, but it works


# ------------------------------------------------------------------------
# first stage - get dependencies
# ------------------------------------------------------------------------

# start with an os image
# Users should look to upgrade to v16 as soon as possible. The currently active 
# LTS branch, v14, will be maintained through the end of April 2023.
# The current Node.js v15 release will remain supported until June 1st, 2021. 
# FROM node:15  # huge 350mb compressed image
# FROM node:15-alpine  # smallest, but harder to work with
# FROM node:15.14-slim
# lts is currently node 16, maintained until April 2024.
FROM node:lts-slim AS build

WORKDIR /usr/app
ENV NODE_ENV production
COPY package.json /usr/app/

# install javascript dependencies

# generate package-lock from package.json, but don't create node_modules
# note: With the --only=production flag (or when the NODE_ENV environment 
# variable is set to production), npm will not install modules listed in 
# devDependencies.
RUN npm install --package-lock-only --only=production

# fix vulnerabilities where able and update package-lock.json.
# normally audit fix runs a full install under the hood, but we don't want that yet.
RUN npm audit fix --package-lock-only --only=production

# install deterministically from package-lock.json to node_modules.
# audit=false means don't submit packages to registry.
# see https://docs.npmjs.com/cli/v8/commands/npm-ci
RUN npm clean-install --audit=false --only=production


# ------------------------------------------------------------------------
# second stage - copy over node_modules and source code
# ------------------------------------------------------------------------

FROM node:lts-slim
ENV NODE_ENV production
USER node
WORKDIR /usr/app

# need package.json so node will know we're using modules
COPY --chown=node:node package.json /usr/app/package.json
COPY --chown=node:node --from=build /usr/app/node_modules /usr/app/node_modules
COPY --chown=node:node src /usr/app/src

# base command - can pass params with CMD [?]
# note: When you run an image that uses the exec form (ie an array), 
# Docker will run the command as is, without a wrapper process. 
# Your Node.js application will be the first and only running process with PID 1.
# be sure to run it with --init flag, so can ctrl-c out of it.
ENTRYPOINT ["node", "/usr/app/src/index.js"]
