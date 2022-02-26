# CloudBeaver Docker image build instructions
# Adapted from https://cloudbeaver.io/docs/Build-and-deploy/
# and https://github.com/dbeaver/cloudbeaver/wiki/Build-and-deploy

# note: dockerfiles run as root by default, so don't need sudo anywhere

#. use these for git checkout below -
# ARG tag=21.3.0
# ARG branch=cb_release_21_3_0

#----------------------------------------------------------------------------
# build app
#----------------------------------------------------------------------------

# base image - has arm64
# https://hub.docker.com/r/adoptopenjdk/openjdk11/tags
# note: we need 11.0.10 because from 11.0.11 on they disabled tls 1.0 and 1.1,
# which is what the jobboss db server uses. the current version is 11.0.13.
# FROM adoptopenjdk/openjdk11:jdk-11.0.12_7-ubuntu-slim
FROM adoptopenjdk/openjdk11:jdk-11.0.10_9-ubuntu-slim

# update os
# install curl and gpg
# add yarn and node repos
# install openjdk maven yarn node 
# install git make
RUN apt update \
  && apt install -y curl gnupg \
  && curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && curl -sL https://deb.nodesource.com/setup_14.x | bash - \
  && apt install -y maven yarn nodejs \
  && apt-get update \
  && apt-get install -y git build-essential

# install npm and lerna
# RUN apt install -y npm  # bombs with this...
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
# so use aptitude to resolve dependencies
# see https://stackoverflow.com/questions/26571326/how-do-i-resolve-the-following-packages-have-unmet-dependencies
RUN apt-get install -y aptitude \
  && aptitude install -y npm \
  && npm install -g lerna

# get latest cloudbeaver source, checkout relevant branch, and build app
# note: ~ will be /root
#. add this so can tie to a specific cloudbase version -
# && git checkout cb_release_21_3_0 \
RUN cd ~ \ 
  && git clone https://github.com/dbeaver/cloudbeaver.git \
  && cd cloudbeaver/deploy \
  && ./build.sh

#----------------------------------------------------------------------------
# install app
#----------------------------------------------------------------------------
# RUN ls -l /root/cloudbeaver/deploy/cloudbeaver
# drwxr-xr-x  2 root root  4096 Jan  9 11:44 conf
# drwxr-xr-x 15 root root  4096 Jan  9 11:42 drivers
# -rw-r--r--  1 root root   477 Jan  9 11:36 run-server.bat
# -rwxr-xr-x  1 root root   469 Jan  9 11:36 run-server.sh
# drwxr-xr-x  3 root root  4096 Jan  9 11:44 samples
# drwxr-xr-x  6 root root  4096 Jan  9 11:44 server
# drwxr-xr-x  4 root root 12288 Jan  9 11:59 web
# drwxr-xr-x  2 root root  4096 Jan  9 11:36 workspace

# # copy app from previous layer - 100+mb
# COPY --from=build /root/cloudbeaver/deploy/cloudbeaver /opt/cloudbeaver

# copy to and use /opt/cloudbeaver, like their dockerfile does -
# https://github.com/dbeaver/cloudbeaver/blob/devel/deploy/docker/Dockerfile
# WORKDIR /root/cloudbeaver/deploy/cloudbeaver
# COPY . /opt/cloudbeaver/
# RUN pwd && ls -l
# # ok

# WORKDIR /opt/cloudbeaver/
# RUN pwd && ls -l
# # it's gone! it just shows Dockerfile, so it's pointing at the wrong folder? how?
# # something mysterious with the mapping in compose.yaml from 
# # local folder to /opt/cloudbeaver?
# # https://stackoverflow.com/questions/30215830/dockerfile-copy-keep-subdirectory-structure
# # https://stackoverflow.com/questions/49604332/dockerfile-what-are-the-intermediate-containers-doing-exactly

# fine, put it back how we had it
WORKDIR /root/cloudbeaver/deploy/cloudbeaver

# can we tell cloudbeaver where to find the workspace folder, put bin somewhere else?

EXPOSE 8978

ENTRYPOINT ["./run-server.sh", "-data", "/var/cloudbeaver/workspace"]
