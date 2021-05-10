# CMake image
# Ubuntu 20.04 ships with cmake-3.16.3
# Ubuntu 21.04 ships with cmake-3.18.4
# we need at least 3.18, which fixes a bug on arm/v7
# but 21.04 seems to bomb on pi

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
FROM ubuntu:20.04 AS build

RUN apt-get update

# set timezone - otherwise apt install can get stuck waiting for input
# see https://serverfault.com/a/1016972/211025
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Chicago
RUN apt-get install -y tzdata

# get dependencies
# need libssl-dev for openssl, then pkg-config so knows where to find it
RUN apt-get install -y wget build-essential libssl-dev
RUN apt-get install -y pkg-config

# build cmake
# note: running cmake below fails when building for linux/arm/7 in macos docker
#   CMake Error at /usr/share/cmake-3.16/Modules/CMakeCompilerIdDetection.cmake:26 (list):
#   list sub-command REMOVE_ITEM requires two or more arguments.
# fix by compiling cmake with CFLAGS - see https://gitlab.kitware.com/cmake/cmake/-/issues/20568#note_780329
# && export CFLAGS="-D_FILE_OFFSET_BITS=64" \
# && export CXXFLAGS="-D_FILE_OFFSET_BITS=64" \
# this is fixed in ubuntu 21.04, which has cmake 3.18.4,
# but we can't use ubuntu 21.04 because it bombs on arm32 (?).
# compilation steps from https://stackoverflow.com/a/59689105/243392
# RUN apt-get install -y wget \
#   && wget --no-check-certificate https://github.com/Kitware/CMake/releases/download/v3.20.2/cmake-3.20.2.tar.gz \
#   && tar zxf cmake-3.20.2.tar.gz \
#   && cd cmake-3.20.2 \
#   && ./bootstrap \
#   && make \
#   && make install

RUN wget --no-check-certificate https://github.com/Kitware/CMake/releases/download/v3.20.2/cmake-3.20.2.tar.gz
RUN tar zxf cmake-3.20.2.tar.gz
RUN cd cmake-3.20.2 && ./bootstrap
RUN cd cmake-3.20.2 && make
RUN cd cmake-3.20.2 && make install

# # multi-stage build - bring only essentials from previous layers
# FROM ubuntu:20.04

# # # change to a new non-root user for better security
# # # this also adds the user to a group with the same name.
# # # --create-home creates a home folder, ie /home/<username>
# # # note: this causes container to fail on arm32 - take out for now
# # RUN useradd --create-home ladder99
# # USER ladder99

# # copy agent app and simulator files to new layer
# # note: add '--chown=ladder99:ladder99' to all COPY statements if change user
# COPY --from=build /usr/local/bin/agent /usr/local/bin
# COPY --from=build /etc/mtconnect /etc/mtconnect

# # bring in our stylesheets
# COPY styles /etc/mtconnect/styles

# # bring in test script
# COPY test-agent.sh /etc/mtconnect

# # expose port
# EXPOSE 5000

# # default run command - can override with docker run or docker-compose.
# # this script runs the app and ruby simulator.
# CMD ["/etc/mtconnect/test-agent.sh"]
