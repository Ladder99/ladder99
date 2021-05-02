# adapter expects ~/data/adapter to have devices.yaml and models folder.

#. experimental

FROM node:15

WORKDIR /home/node/app

# install javascript dependencies
COPY ./package*.json ./
RUN npm ci --production

# copy code
COPY ./src ./src

# default command when run container
CMD ["npm", "start"]
