# adapter expects ~/data/adapter to have devices.yaml and models folder.

#. experimental

# FROM node:15  # huge 350mb compressed images
# FROM alpine
# RUN apk add --update nodejs  # doesn't include npm
# FROM node:15-alpine  # smallest, but harder to work with
FROM node:15-slim

# change to a new non-root user for better security.
# this also adds the user to a group with the same name.
# --create-home creates a home folder, ie /home/<username>
RUN useradd --create-home ladder99
USER ladder99

# WORKDIR /home/node/app
WORKDIR /home/ladder99/app

# install javascript dependencies
COPY ./package*.json ./
RUN npm ci --production

# copy code
COPY ./src ./src

# default command when run container
CMD ["npm", "start"]
