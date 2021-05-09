# MTConnect C++ Agent docker image
# adapted from http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu
# don't need sudo as containers run as root by default.

#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
# FROM ubuntu:20.04 AS compile  # cmake for this has probs building for arm
FROM ubuntu:21.04 AS compile

RUN apt-get update

# set timezone - otherwise apt install can get stuck waiting for input
# see https://serverfault.com/a/1016972/211025
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Chicago
RUN apt-get install -y tzdata

# get dependencies
# note: removed ruby - install in second stage
# note: remove cmake if build it ourselves later
RUN apt-get install -y \
  git cmake build-essential libxml2 libxml2-dev libcppunit-dev screen curl

#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

# get latest cppagent source
# and check out april 16, 2021 version, before turned file monitor on.
# trying to see if that causes pi crash.
RUN mkdir -p ~/agent/build \
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git --depth 1 \
  && git checkout a6c47791655bf35bff82cf0023e509bfca481ab8


# # build cmake
# # note: running cmake below fails when building for linux/arm/7 in macos docker
# #   CMake Error at /usr/share/cmake-3.16/Modules/CMakeCompilerIdDetection.cmake:26 (list):
# #   list sub-command REMOVE_ITEM requires two or more arguments.
# # fix by compiling cmake with CFLAGS - see https://gitlab.kitware.com/cmake/cmake/-/issues/20568#note_780329
# # && export CFLAGS="-D_FILE_OFFSET_BITS=64" \
# # && export CXXFLAGS="-D_FILE_OFFSET_BITS=64" \
# # this is fixed in ubuntu 21.04, which has cmake 3.18.4,
# # but we can't use ubuntu 21.04 because it bombs on arm32 (?).
# # compilation steps from https://stackoverflow.com/a/59689105/243392
# RUN apt-get install -y wget \
#   && wget --no-check-certificate https://github.com/Kitware/CMake/releases/download/v3.20.2/cmake-3.20.2.tar.gz \
#   && tar zxvf cmake-3.20.2.tar.gz \
#   && cd cmake-3.20.2 \
#   && ./bootstrap \
#   && make \
#   && make install

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
# FROM ubuntu:20.04
FROM ubuntu:21.04

# install ruby for simulator
RUN apt-get update && apt-get install -y ruby

# # for debugging
# RUN apt-get install -y strace

# # change to a new non-root user for better security
# # this also adds the user to a group with the same name.
# # --create-home creates a home folder, ie /home/<username>
# # note: this causes container to fail on arm32 - take out for now
# RUN useradd --create-home ladder99
# USER ladder99

# copy agent app and simulator files to new layer
# note: add '--chown=ladder99:ladder99' to all COPY statements if change user
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
