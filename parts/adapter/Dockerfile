FROM node

WORKDIR /usr/src/app

# install javascript dependencies
COPY src/adapter/package*.json ./
RUN npm ci --production

# install source
COPY src/adapter/src ./src

# default command on run container
CMD ["npm", "start"]
