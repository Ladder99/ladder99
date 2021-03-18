FROM node

WORKDIR /home/node/app

# install javascript dependencies
COPY code/package*.json ./
RUN npm ci --production

# install source
COPY code/src ./src

# default command on run container
# CMD ["npm", "start"]
# When creating an image, you can bypass the package.json's npm start 
# command and bake it directly into the image itself. First off this 
# reduces the number of processes running inside of your container. 
# Secondly it causes exit signals such as SIGTERM and SIGINT to be 
# received by the Node.js process instead of npm swallowing them.
CMD ["node", "src/index.js"]

# see https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node
