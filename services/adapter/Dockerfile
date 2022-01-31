# adapter dockerfile
# based on https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds
# keep in synch with pipeline/relay/Dockerfile

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
# got prebuild-install WARN install No prebuilt binaries found (target=3 runtime=napi arch=arm64 libc= platform=linux)
# see https://github.com/node-hid/node-hid#compiling-from-source
# note: if apt-get update fails on raspberry pi with something about http and returns 100,
# there might be an issue with libseccomp2 on the host system. 
# you can upgrade it with the following -
#   sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 04EE7237B7D453EC 648ACFD622F3D138
#   echo "deb http://deb.debian.org/debian buster-backports main" | sudo tee -a /etc/apt/sources.list.d/buster-backports.list
#   sudo apt update
#   sudo apt install -t buster-backports libseccomp2
# see https://www.reddit.com/r/Readarr/comments/ixajkk/working_docker_image_for_raspberry_pi_os_buster/glh774f/
RUN apt-get update -y && apt-get install --fix-missing -y nodejs npm libudev-dev \
  libusb-1.0-0 libusb-1.0-0-dev pkg-config

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
