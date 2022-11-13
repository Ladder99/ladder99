# docker image build instructions
#
# ./l99 build simulator 0.8.1-arm
#
# keep in synch with all Dockerfiles - adapter, meter, recorder, relay, simulator.
#
# see https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume-after-npm-install-succeeds
# and https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/

# not sure we need two stages, but it works


# ------------------------------------------------------------------------
# first stage - get dependencies
# ------------------------------------------------------------------------

# start with an os image

# node
# always use even numbers with Node because those are the 
# long-term support (LTS) versions
# pinning all the way to the patch level of the version ensures consistent, 
# reproducible builds and tests.
# The slim versions are generally just a good way to reduce bloat.
# Users should look to upgrade to v16 as soon as possible. The currently active 
# LTS branch, v14, will be maintained through the end of April 2023.
# The current Node.js v15 release will remain supported until June 1st, 2021. 
# FROM node:15  # huge 350mb compressed image
# FROM node:15-alpine  # smallest, but harder to work with
# FROM node:15.14-slim
# lts is currently node 16, maintained until April 2024.
# FROM node:lts-slim AS build

# but need python also for dymo.js driver - usb module compilation -
# can't use slim version because need `make` etc.
# see https://hub.docker.com/r/nikolaik/python-nodejs
# this nowork because no ARM image available -
# FROM nikolaik/python-nodejs:python3.9-nodejs16

# ubuntu includes python and has images for ARM also
# see https://hub.docker.com/_/ubuntu
# FROM ubuntu:21.04 AS build
# 22.04 is current lts release
FROM ubuntu:22.04 AS build

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
# add openssl
RUN apt-get update -y && apt-get install --fix-missing -y nodejs npm libudev-dev \
  libusb-1.0-0 libusb-1.0-0-dev pkg-config

WORKDIR /usr/app
ENV NODE_ENV production
COPY package.json /usr/app/

# install javascript dependencies

# first increase the timeout from 30 secs to 2mins to handle slow connections.
# generate package-lock from package.json, but don't create node_modules
# note: With the --only=production flag (or when the NODE_ENV environment 
# variable is set to production), npm will not install modules listed in 
# devDependencies.
# fix vulnerabilities where able and update package-lock.json.
# normally audit fix runs a full install under the hood, but we don't want that yet.
# install deterministically from package-lock.json to node_modules.
# audit=false means don't submit packages to registry.
# see https://docs.npmjs.com/cli/v8/commands/npm-ci
RUN npm config set fetch-retry-maxtimeout 120000 \
  && npm install --package-lock-only --only=production \
  && npm audit fix --package-lock-only --only=production \
  && npm clean-install --audit=false --only=production

# ------------------------------------------------------------------------
# second stage - copy over node_modules and source code
# ------------------------------------------------------------------------

# FROM node:lts-slim
FROM node:lts
ENV NODE_ENV production
# # need for node-opc package
# RUN apt-get install -y openssl

#. um, getting read/write errors on cookie files because they're already there as root
# USER node

WORKDIR /usr/app

# need package.json so node will know we're using modules
# COPY --chown=node:node package.json /usr/app/package.json
# COPY --chown=node:node --from=build /usr/app/node_modules /usr/app/node_modules
# COPY --chown=node:node src /usr/app/src
# COPY package.json src/** /usr/app/ # how do this?


COPY package.json /usr/app/package.json
COPY src /usr/app/src
COPY --from=build /usr/app/node_modules /usr/app/node_modules


# base command - can pass params with CMD [?]
# note: When you run an image that uses the exec form (ie an array), 
# Docker will run the command as is, without a wrapper process. 
# Your Node.js application will be the first and only running process with PID 1.
# be sure to run it with --init flag, so can ctrl-c out of it.
ENTRYPOINT ["node", "/usr/app/src/index.js"]
