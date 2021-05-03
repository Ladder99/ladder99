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

ENV NODE_ENV production

WORKDIR /home/ladder99/adapter

# install javascript dependencies
COPY --chown=ladder99:ladder99 ./package*.json ./
RUN npm ci --production

# copy code, assigning to user instead of root
# COPY ./src ./src
COPY --chown=ladder99:ladder99 ./src ./src

# default command when run container
# this form 
CMD ["npm", "start"]
