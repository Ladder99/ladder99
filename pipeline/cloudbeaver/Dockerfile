# CloudBeaver Docker image build instructions
# Adapted from https://cloudbeaver.io/docs/Build-and-deploy/
# and https://github.com/dbeaver/cloudbeaver/wiki/Build-and-deploy

# # multi-stage dockerfile - build app, then bring only essentials into new os

# ARG tag=21.3.0
# ARG branch=cb_release_21_3_0

#----------------------------------------------------------------------------
# build app
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
# FROM ubuntu:21.04 as build

# https://hub.docker.com/r/adoptopenjdk/openjdk11/tags
# FROM adoptopenjdk/openjdk11:jdk-11.0.12_7-ubuntu-slim
FROM adoptopenjdk/openjdk11:jdk-11.0.10_9-ubuntu-slim

# note: dockerfiles run as root by default, so don't need sudo

# # update os
# # install curl and gpg
# # add yarn and node repos
# # install openjdk maven yarn node 
# # update again
# # install git and make
# RUN apt update \
#   && apt install -y curl gnupg \
#   && curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
#   && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
#   && curl -sL https://deb.nodesource.com/setup_14.x | bash - \
#   && apt install -y openjdk-11-jdk=11.0.7+10-3ubuntu1 maven yarn nodejs \
#   && apt-get update \
#   && apt-get install -y git build-essential

RUN apt update \
  && apt-get install -y git

# # install npm and lerna
# # RUN apt install -y npm  # bombs with 
# # --------
# # Some packages could not be installed. This may mean that you have
# # requested an impossible situation or if you are using the unstable
# # distribution that some required packages have not yet been created
# # or been moved out of Incoming.
# # The following information may help to resolve the situation:
# # The following packages have unmet dependencies:
# # libnode72 : Conflicts: nodejs-legacy
# # nodejs : Conflicts: npm
# # E: Unable to correct problems, you have held broken packages.
# # The command '/bin/sh -c apt install -y npm' returned a non-zero code: 100
# # ERROR: Service 'cloudbeaver' failed to build : Build failed
# # --------
# # so use aptitude to resolve dependencies
# # see https://stackoverflow.com/questions/26571326/how-do-i-resolve-the-following-packages-have-unmet-dependencies
# RUN apt-get install -y aptitude \
#   && aptitude install -y npm \
#   && npm install -g lerna

# get latest cloudbeaver source, checkout relevant branch, and build app
# note: ~ will be /root
RUN cd ~ \ 
  && git clone https://github.com/dbeaver/cloudbeaver.git \
  && cd cloudbeaver/deploy \
  && ./build.sh

# && git checkout cb_release_21_3_0 \

#----------------------------------------------------------------------------
# install app
#----------------------------------------------------------------------------

# # start with base os
# FROM ubuntu:21.04

# # copy app from previous layer - 100+mb
# COPY --from=build /root/cloudbeaver/deploy/cloudbeaver /root/cloudbeaver

# WORKDIR /root/cloudbeaver

WORKDIR /root/cloudbeaver/deploy/cloudbeaver

# expose port
EXPOSE 8978

# default command - can override with docker run or docker-compose command
# CMD ./run-server.sh

ENTRYPOINT ["./run-server.sh"]
