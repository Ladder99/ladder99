# dockerfile for relay
# based on https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds
# keep in synch with other Dockerfiles - adapter, meter, recorder, relay

# FROM node:15  # huge 350mb compressed images
# FROM node:15-alpine  # smallest, but harder to work with
FROM node:15.14-slim

# install javascript dependencies
# for npm install-clean, see https://docs.npmjs.com/cli/v8/commands/npm-ci
# note: With the --production flag (or when the NODE_ENV environment 
# variable is set to production), npm will not install modules listed in 
# devDependencies. 
WORKDIR /data
ENV NODE_ENV production
# COPY ./package*.json ./
COPY ./relay/package*.json ./
RUN npm install-clean --production

# install app
# WORKDIR /data/app
ENV PATH /data/node_modules/.bin:$PATH
# COPY ./src ./src
COPY ./relay/src /data/app/src
# COPY ./common /data/common

# base command - can pass params with CMD
ENTRYPOINT ["node", "/data/app/src/relay.js"]
