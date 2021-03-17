# status - works but simpler to just use predefined image in docker-compose

FROM node

WORKDIR /usr/src/app

# install javascript dependencies
COPY src/broker/package*.json ./
RUN npm ci --production

# copy source
COPY src/broker/src ./src

# default command when run container
CMD ["npm", "start"]
