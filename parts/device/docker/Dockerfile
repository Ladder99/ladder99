FROM node

WORKDIR /usr/src/app

# install javascript dependencies
COPY src/device/package*.json ./
RUN npm ci --production

# install source
COPY src/device/src ./src

# default command on run container
CMD ["npm", "start"]
