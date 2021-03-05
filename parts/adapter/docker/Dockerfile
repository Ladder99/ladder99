FROM node

# WORKDIR /usr/src/app
WORKDIR /home/node/app

# install javascript dependencies
COPY parts/adapter/code/package*.json ./
RUN npm ci --production

# install source
COPY parts/adapter/code/src ./src

# default command on run container
# CMD ["npm", "start"]
CMD ["node", "src/index.js"]

USER node
