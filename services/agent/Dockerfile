# mtconnect c++ agent
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu
# divided into stages with FROM ... AS ..., so docker can cache intermediate steps,
# which are slow.

#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# this ubuntu has linux/arm/v7, linux/amd64
# see https://hub.docker.com/layers/ubuntu/library/ubuntu/20.04/images/sha256-b30065ff935c7761707eab66d3edc367e5fc1f3cc82c2e4addd69cee3b9e7c1c?context=explore
FROM ubuntu:20.04 AS make-os
# FROM raspbian/stretch AS make-os  # too old
# FROM balenalib/raspberry-pi-debian:build AS make-os  # only arm64

# update package indexes
RUN apt-get update

# set timezone
RUN ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime && \
  echo $CONTAINER_TIMEZONE > /etc/timezone

# get dependencies
# The C++ agent depends on libxml2 and for testing libcppunit. 
# The rest are the standard packages for building software. 
# We also use cmake to generate the make files.
# i removed ruby.
RUN apt-get install -y \
  libxml2 libxml2-dev libcppunit-dev \
  cmake git build-essential screen curl


#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

FROM make-os as make-makefile

# get agent source
# note: user is root, so ~ is /root - ok?
RUN mkdir -p ~/agent/build && \
  cd ~/agent && \
  git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
# fails when building for linux/arm/7 in macos docker - need to build in pi docker.
#   CMake Error at /usr/share/cmake-3.16/Modules/CMakeCompilerIdDetection.cmake:26 (list):
#   list sub-command REMOVE_ITEM requires two or more arguments.
RUN cd ~/agent/build && \
  cmake \
  -D CMAKE_BUILD_TYPE=Release \
  ../cppagent/


#----------------------------------------------------------------------------
# compile app
#----------------------------------------------------------------------------

FROM make-makefile as compile

# compile source (~20mins)
RUN cd ~/agent/build && \
  make && \
  cp agent/agent /usr/local/bin


#----------------------------------------------------------------------------
# run app
#----------------------------------------------------------------------------

FROM compile as run

# define ports to listen on
EXPOSE 5000

# define default run command
# CMD ["agent", "debug", "/etc/mtconnect/agent-custom/agent.cfg"]
CMD ["agent", "debug", "/etc/ladder99-agent/agent.cfg"]
