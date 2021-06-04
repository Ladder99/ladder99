# sim-mqtt dockerfile - record and play mqtt messages

# FROM node:15  # huge 350mb compressed images
# FROM node:15-alpine  # smallest, but harder to work with
# FROM node:15.14-slim
FROM python:3.8-slim

# install requirements
RUN pip install -r requirements.txt

# # install javascript dependencies
# WORKDIR /data
# ENV NODE_ENV production
# COPY ./package*.json ./
# RUN npm ci --production

# # install app
# WORKDIR /data/app
# ENV PATH /data/node_modules/.bin:$PATH
# COPY ./src ./src

# # default command when run container
# CMD ["npm", "start"]
