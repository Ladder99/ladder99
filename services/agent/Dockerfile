# MTConnect C++ Agent docker image
# adapted from http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

# note: removed 'sudo' from commands - ubuntu doesn't recognize it.

#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
# FROM raspbian/stretch AS make-os  # too old
# FROM balenalib/raspberry-pi-debian:build AS make-os  # only arm64
# FROM ubuntu:21.04 AS compile  # causing probs - see second stage
FROM ubuntu:20.04 AS compile

RUN apt-get update

# # set timezone - otherwise apt install can get stuck waiting for input
# see https://serverfault.com/a/1016972/211025
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Chicago
RUN apt-get install -y tzdata

# get dependencies
# note: removed ruby - install in second stage
# and removed cmake as we'll build it ourselves
RUN apt-get install -y \
  git build-essential libxml2 libxml2-dev libcppunit-dev screen curl

#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

# get latest cppagent source
RUN mkdir -p ~/agent/build \
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git --depth 1

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
RUN apt-get install -y wget \
  && wget https://github.com/Kitware/CMake/releases/download/v3.20.2/cmake-3.20.2.tar.gz \
  && tar zxvf cmake-3.20.2.tar.gz \
  && cd cmake-3.20.2 \
  && ./bootstrap \
  && make \
  && make install

# build makefile using cmake
RUN cd ~/agent/build \
  && cmake -D CMAKE_BUILD_TYPE=Release ../cppagent/

#----------------------------------------------------------------------------
# compile app
#----------------------------------------------------------------------------

# compile source (~20mins - 3hrs)
RUN cd ~/agent/build \
  && make \
  && cp agent/agent /usr/local/bin

# copy simulator
RUN mkdir -p /etc/mtconnect \
  && cd ~/agent/cppagent \
  && cp -r schemas simulator /etc/mtconnect \
  && cp -r styles /etc/mtconnect/styles-orig

# add our stylesheet for the / endpoint
RUN echo "DevicesStyle { Location = /styles/Devices.xsl }" >> /etc/mtconnect/simulator/agent.cfg

#----------------------------------------------------------------------------
# run app
#----------------------------------------------------------------------------

# multi-stage build - bring only essentials from previous layers
# FROM ubuntu:21.04  # causing error?
FROM ubuntu:20.04

RUN apt-get update

# install ruby for simulator
RUN apt-get install -y ruby

# for debugging
# RUN apt-get install -y strace

# change to a new non-root user for better security
# this also adds the user to a group with the same name.
# --create-home creates a home folder, ie /home/<username>
RUN useradd --create-home ladder99
USER ladder99

# copy agent app and simulator files to new layer
COPY --chown=ladder99:ladder99 --from=compile /usr/local/bin/agent /usr/local/bin
COPY --chown=ladder99:ladder99 --from=compile /etc/mtconnect /etc/mtconnect

# bring in our stylesheets
COPY --chown=ladder99:ladder99 styles /etc/mtconnect/styles

# bring in test script
COPY --chown=ladder99:ladder99 test-agent.sh /etc/mtconnect

# expose port
EXPOSE 5000

# default run command - can override with docker run or docker-compose.
# this script runs the app and ruby simulator.
CMD ["/etc/mtconnect/test-agent.sh"]
