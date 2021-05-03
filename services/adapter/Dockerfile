# adapter expects ~/data/adapter to have devices.yaml and models folder.

#. experimental

# FROM node:15  # huge 350mb compressed images
# FROM alpine
# RUN apk add --update nodejs  # doesn't include npm
# FROM node:15-alpine  # smallest, but harder to work with
FROM node:15-slim

WORKDIR /home/node/app

# install javascript dependencies
COPY ./package*.json ./
RUN npm ci --production

# copy code
COPY ./src ./src

# change to a new non-root user for better security
RUN groupadd --gid 1000 ladder99 \
  && useradd --gid 1000 --uid 1000 --create-home ladder99
USER ladder99

# default command when run container
CMD ["npm", "start"]
