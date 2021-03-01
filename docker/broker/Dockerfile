FROM node

WORKDIR /usr/src/app

# install javascript dependencies
COPY src/broker/package*.json ./
RUN npm ci --production

# install source
COPY src/broker/src ./src

# default command on run container
CMD ["npm", "start"]
