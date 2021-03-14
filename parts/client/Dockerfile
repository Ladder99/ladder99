FROM node

WORKDIR /home/node/app

# install javascript dependencies
COPY code/package*.json ./
RUN npm ci --production

# install source
COPY code/src ./src

# default command on run container
CMD ["node", "src/index.js"]

# this causes permission denied error when connecting to agent
# USER node
