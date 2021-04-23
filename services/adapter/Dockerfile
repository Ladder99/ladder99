FROM node:15

WORKDIR /home/node/app

# install javascript dependencies
COPY ./package*.json ./
RUN npm ci --production

# copy source
# this expects src/data/devices.yaml and src/data/models to be there -
# calling code needs to copy those from relevant parent folders,
# because can't copy data from parent folders.
# see Justfile - copy-adapter-data and delete-adapter-data.
# better way?
COPY ./src ./src

# default command when run container
CMD ["npm", "start"]
