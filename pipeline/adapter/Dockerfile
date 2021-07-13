# adapter dockerfile
# based on https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds

# FROM node:15  # huge 350mb compressed images
# FROM node:15-alpine  # smallest, but harder to work with
FROM node:15.14-slim

# install javascript dependencies
WORKDIR /data
ENV NODE_ENV production
COPY ./package*.json ./
RUN npm ci --production

# install app
WORKDIR /data/app
ENV PATH /data/node_modules/.bin:$PATH
COPY ./src ./src

# base command - can pass params with CMD
ENTRYPOINT ["node", "/data/app/src/adapter.js"]

# default command when run container
# CMD ["node", "/data/app/src/adapter.js"]
