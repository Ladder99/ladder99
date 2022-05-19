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
COPY ./package*.json ./
RUN npm install-clean --production

# install app
WORKDIR /data/app
ENV PATH /data/node_modules/.bin:$PATH
COPY ./src ./src

# base command - can pass params with CMD
# note: When you run an image that uses the exec form (ie an array), 
# Docker will run the command as is, without a wrapper process. 
# Your Node.js application will be the first and only running process with PID 1.

ENTRYPOINT ["node", "/data/app/src/relay.js"]
