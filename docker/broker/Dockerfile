FROM node

WORKDIR /usr/src/app

# install javascript dependencies
COPY src/broker/package*.json ./
RUN npm ci --production

# copy source
COPY src/broker/src ./src

# default command when run container
CMD ["npm", "start"]
