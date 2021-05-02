# adapter expects ~/data/adapter to have devices.yaml and models folder.

#. experimental

# FROM node:15  # huge 350mb compressed images
# FROM alpine
# RUN apk add --update nodejs  # doesn't include npm
FROM node:15-alpine

WORKDIR /home/node/app

# install javascript dependencies
COPY ./package*.json ./
RUN npm ci --production

# copy code
COPY ./src ./src

# default command when run container
CMD ["npm", "start"]
