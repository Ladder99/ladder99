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
# this follows recommended docker practices -
# see https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#run
RUN apt install -y \
  openjdk-11-jdk \
  maven \
  yarn \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g lerna

# nodejs \
# npm \

# get latest source and build app
RUN cd ~ \ 
  && git clone https://github.com/dbeaver/cloudbeaver.git \
  && cd cloudbeaver/deploy \
  && ./build.sh

#----------------------------------------------------------------------------
# install app
#----------------------------------------------------------------------------

# start with base os
FROM ubuntu:21.04

# # change to a new non-root user for better security.
# # this also adds the user to a group with the same name.
# # --create-home creates a home folder, ie /home/<username>
# RUN useradd --create-home agent
# USER agent

# # copy agent app and simulator files from previous layers
# COPY --chown=agent:agent --from=compile /usr/local/bin/agent /usr/local/bin
# COPY --chown=agent:agent --from=compile /etc/mtconnect /etc/mtconnect

# install app from previous layer - copies 100+mb
COPY --from=build ~/cloudbeaver/deploy/cloudbeaver /apps/cbeaver

WORKDIR /apps/cbeaver

# expose port
EXPOSE 8978

# default command - can override with docker run or docker-compose command
CMD ./run-server.sh
