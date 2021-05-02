# MTConnect C++ Agent docker image
# adapted from http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

# note: removed 'sudo' from commands - ubuntu doesn't recognize it.

#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
FROM ubuntu:21.04 AS compile
# FROM raspbian/stretch AS make-os  # too old
# FROM balenalib/raspberry-pi-debian:build AS make-os  # only arm64

# get dependencies
# note: removed ruby - install in second stage
RUN apt-get update && apt-get install -y \
  git cmake build-essential libxml2 libxml2-dev libcppunit-dev screen curl

# change to a new non-root user for better security
RUN groupadd --gid 1000 ladder99
RUN useradd --gid 1000 --uid 1000 --create-home ladder99
USER ladder99

#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

# get agent source
RUN mkdir -p ~/agent/build \
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
# note: fails when building for linux/arm/7 in macos docker:
#   CMake Error at /usr/share/cmake-3.16/Modules/CMakeCompilerIdDetection.cmake:26 (list):
#   list sub-command REMOVE_ITEM requires two or more arguments.
# fix with CFLAGS - see https://gitlab.kitware.com/cmake/cmake/-/issues/20568#note_780329
RUN cd ~/agent/build \
  && export CFLAGS="-D_FILE_OFFSET_BITS=64" \
  && export CXXFLAGS="-D_FILE_OFFSET_BITS=64" \
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
FROM ubuntu:21.04

# install ruby for simulator
RUN apt-get update && apt-get install -y ruby

# copy agent app and simulator files to new layer
COPY --from=compile /usr/local/bin/agent /usr/local/bin
COPY --from=compile /etc/mtconnect /etc/mtconnect

# bring in our stylesheets
COPY styles /etc/mtconnect/styles

# bring in test script
COPY test-agent.sh /etc/mtconnect

# expose port
EXPOSE 5000

# default run command - can override with docker run or docker-compose.
# this script runs the app and ruby simulator.
CMD ["/etc/mtconnect/test-agent.sh"]
