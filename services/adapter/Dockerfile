FROM node:15

# WORKDIR /usr/src/app
WORKDIR /home/node/app

# install javascript dependencies
# COPY services/adapter/package*.json ./
COPY ./package*.json ./
RUN npm ci --production

# copy source
COPY ./src ./src

# copy data
# COPY ../../setups/pi/devices.yaml /etc/ladder99
# COPY ../../models /etc/ladder99/models
COPY ./data ./data

# default command when run container
CMD ["npm", "start"]
