# adapter dockerfile
# based on https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds
# keep in synch with pipeline/application/Dockerfile

# FROM node:15  # huge 350mb compressed images
# FROM node:15-alpine  # smallest, but harder to work with
# FROM node:15.14-slim

# need python also for dymo.js driver - usb module compilation -
# can't use slim version because need `make` etc.
# see https://hub.docker.com/r/nikolaik/python-nodejs
# this nowork because no ARM image available
# FROM nikolaik/python-nodejs:python3.9-nodejs16

# ubuntu includes python and has images for ARM also
# see https://hub.docker.com/_/ubuntu
FROM ubuntu:21.04

# prevent apt install from getting stuck at timezone info
# see https://askubuntu.com/questions/909277/avoiding-user-interaction-with-tzdata-when-installing-certbot-in-a-docker-contai
ENV DEBIAN_FRONTEND=noninteractive 

# need these for dymo driver else get errors -
# error: libudev.h: No such file or directory
# error: libusb-1.0.so.0: cannot open shared object file: No such file or directory
# https://askubuntu.com/questions/852337/libusb-1-0-so-0-error
# RUN apt-get update -y && apt-get install -y libudev-dev libusb-1.0-0
RUN apt-get update -y && apt-get install -y apt-transport-https nodejs npm libudev-dev libusb-1.0-0

# got prebuild-install WARN install No prebuilt binaries found (target=3 runtime=napi arch=arm64 libc= platform=linux)
# gyp info using node-gyp@7.1.2
# gyp info using node@12.21.0 | linux | arm64
# gyp info find Python using Python version 3.9.5 found at "/usr/bin/python3"
# will this fix problem? get newer version of node-gyp?
# RUN npm install -g node-gyp
# RUN npm install -g npm

# install javascript dependencies
WORKDIR /data
ENV NODE_ENV production
COPY ./package*.json ./
RUN npm ci --production

# install app
WORKDIR /data/app
ENV PATH /data/node_modules/.bin:$PATH
COPY ./src ./src

# base command - can pass params with CMD
ENTRYPOINT ["node", "/data/app/src/adapter.js"]

# default command when run container
# CMD ["node", "/data/app/src/adapter.js"]
