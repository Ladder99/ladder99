# mtconnect c++ agent
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

# note: removed 'sudo' from commands - ubuntu doesn't recognize it.

#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# base image - ubuntu has linux/arm/v7, linux/amd64, etc
FROM ubuntu:21.04 AS compile
# FROM raspbian/stretch AS make-os  # too old
# FROM balenalib/raspberry-pi-debian:build AS make-os  # only arm64

# get dependencies
RUN apt-get update \
  && apt-get install -y git cmake build-essential libxml2 libxml2-dev libcppunit-dev screen ruby curl

#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

# get agent source
# note: user is root, so ~ is /root
RUN mkdir -p ~/agent/build \
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
#. fails when building for linux/arm/7 in macos docker - need to build in pi docker.
#   CMake Error at /usr/share/cmake-3.16/Modules/CMakeCompilerIdDetection.cmake:26 (list):
#   list sub-command REMOVE_ITEM requires two or more arguments.
# see https://gitlab.kitware.com/cmake/cmake/-/issues/20568#note_780329
# you need to recompile cmake with that flag. You can set it via your environment variables:
# export CFLAGS="-D_FILE_OFFSET_BITS=64"
# export CXXFLAGS="-D_FILE_OFFSET_BITS=64"
# still get same error though...
RUN cd ~/agent/build \
  && export CFLAGS="-D_FILE_OFFSET_BITS=64" \
  && export CXXFLAGS="-D_FILE_OFFSET_BITS=64" \
  && cmake -D CMAKE_BUILD_TYPE=Release ../cppagent/

#----------------------------------------------------------------------------
# compile app
#----------------------------------------------------------------------------

# compile source (~20mins)
RUN cd ~/agent/build \
  && make \
  && cp agent/agent /usr/local/bin

# copy simulator
RUN mkdir -p /etc/mtconnect \
  && cd ~/agent/cppagent \
  && cp -r schemas simulator /etc/mtconnect \
  && cp -r styles /etc/mtconnect/styles-orig


#----------------------------------------------------------------------------
# run app
#----------------------------------------------------------------------------

# multi-stage build - bring only essentials from previous layers
FROM ubuntu:21.04

# install ruby for simulator
RUN apt-get update && apt-get install -y ruby

COPY --from=compile /usr/local/bin/agent /usr/local/bin
COPY --from=compile /etc/mtconnect /etc/mtconnect

COPY styles/* /etc/mtconnect/styles
COPY test-agent.sh /root

# expose port
EXPOSE 5000

# default run command - can override with docker run or docker-compose.
# the script runs the simulator and the app.
CMD ["/root/test-agent.sh"]
