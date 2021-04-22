# image for arm
# see Justfile - build-adapter

# FROM node:14-slim
FROM arm32v7/node:buster-slim

# not /home/node/app ?
WORKDIR /usr/src/app

# install javascript dependencies
# COPY services/adapter/package*.json ./
COPY ./package*.json ./
RUN npm ci --production

# copy source
# COPY services/adapter/src ./src
COPY ./src ./src

# default command when run container
CMD ["npm", "start"]
