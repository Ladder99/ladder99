# CloudBeaver Docker image build instructions
# Adapted from https://cloudbeaver.io/docs/Build-and-deploy/
# and https://github.com/dbeaver/cloudbeaver/wiki/Build-and-deploy

# multi-stage dockerfile - build app, then bring only essentials into new os

#----------------------------------------------------------------------------
# build app
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
FROM ubuntu:21.04 as build

# update os and get curl
RUN apt update && apt install -y curl gnupg

# add node and yarn repos
# note: dockerfiles run as root by default, so don't need sudo
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && curl -sL https://deb.nodesource.com/setup_14.x | bash -

# add dependencies
RUN apt install -y \
  openjdk-11-jdk \
  maven \
  yarn \
  nodejs

# install npm
# RUN apt install -y npm  # bombs with 
# --------
# Some packages could not be installed. This may mean that you have
# requested an impossible situation or if you are using the unstable
# distribution that some required packages have not yet been created
# or been moved out of Incoming.
# The following information may help to resolve the situation:
# The following packages have unmet dependencies:
# libnode72 : Conflicts: nodejs-legacy
# nodejs : Conflicts: npm
# E: Unable to correct problems, you have held broken packages.
# The command '/bin/sh -c apt install -y npm' returned a non-zero code: 100
# ERROR: Service 'cloudbeaver' failed to build : Build failed
# --------
# so try aptitude to resolve dependencies
# see https://stackoverflow.com/questions/26571326/how-do-i-resolve-the-following-packages-have-unmet-dependencies
RUN apt-get install -y aptitude \
  && aptitude install -y npm

# install lerna
RUN npm install -g lerna

# install git
RUN apt-get update \
  && apt-get install -y git

# install make
RUN apt-get update \
  && apt-get install -y build-essential

# get latest cloudbeaver source and build app
RUN cd ~ \ 
  && git clone https://github.com/dbeaver/cloudbeaver.git \
  && cd cloudbeaver/deploy \
  && ./build.sh

#----------------------------------------------------------------------------
# install app
#----------------------------------------------------------------------------

# # start with base os
# FROM ubuntu:21.04

# # copy app from previous layer - 100+mb
# COPY --from=build ~/cloudbeaver/deploy/cloudbeaver /apps/cbeaver

# WORKDIR /apps/cbeaver

RUN echo set workdir
WORKDIR /home/ubuntu/cloudbeaver/deploy/cloudbeaver

# expose port
RUN echo expose port
EXPOSE 8978

# default command - can override with docker run or docker-compose command
RUN echo run server
RUN cat ./run-server.sh
CMD ./run-server.sh
