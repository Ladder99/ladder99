FROM node:15

# WORKDIR /usr/src/app
WORKDIR /home/node/app

# install javascript dependencies
# COPY services/adapter/package*.json ./
COPY ./package*.json ./
RUN npm ci --production

# copy source
# this expects src/data/devices.yaml and src/data/models to be there -
# calling code needs to copy those from relevant parent folders.
COPY ./src ./src

# copy data
# can't copy from parent folders
# COPY ../../setups/pi/devices.yaml /etc/ladder99
# COPY ../../models /etc/ladder99/models
# COPY ./data ./data

# default command when run container
CMD ["npm", "start"]
