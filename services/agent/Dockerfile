# mtconnect c++ agent
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu
# divided into stages with FROM ... AS ..., so docker can cache intermediate steps,
# which are slow.

# note: removed 'sudo' from commands, as it wasn't recognized by ubuntu


#----------------------------------------------------------------------------
# build os
#----------------------------------------------------------------------------

# this ubuntu has linux/arm/v7, linux/amd64
# see https://hub.docker.com/layers/ubuntu/library/ubuntu/20.04/images/sha256-b30065ff935c7761707eab66d3edc367e5fc1f3cc82c2e4addd69cee3b9e7c1c?context=explore
FROM ubuntu:21.04 AS make-os
# FROM raspbian/stretch AS make-os  # too old
# FROM balenalib/raspberry-pi-debian:build AS make-os  # only arm64

# # set timezone
# #. where does envar get set? it's not in macos
# RUN ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime && \
#   echo $CONTAINER_TIMEZONE > /etc/timezone

# update package indexes
RUN apt-get update \
  && apt-get install -y git cmake build-essential libxml2 libxml2-dev libcppunit-dev screen ruby curl

#----------------------------------------------------------------------------
# build makefile
#----------------------------------------------------------------------------

FROM make-os as make-makefile

# get agent source
# note: user is root, so ~ is /root - ok?
RUN mkdir -p ~/agent/build \
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
# fails when building for linux/arm/7 in macos docker - need to build in pi docker.
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

FROM make-makefile as compile

# compile source (~20mins)
RUN cd ~/agent/build \
  && make \
  && cp agent/agent /usr/local/bin

# setup agent
RUN cd ~/agent/cppagent \
  && mkdir -p /etc/mtconnect/agent /etc/mtconnect/adapter \
  && cp -r styles schemas simulator/VMC-3Axis.xml /etc/mtconnect/agent

# setup simulator
RUN cd ~/agent/cppagent \
  && cp simulator/VMC-3Axis-Log.txt simulator/run_scenario.rb /etc/mtconnect/adapter

COPY agent.cfg /etc/mtconnect/adapter


#----------------------------------------------------------------------------
# run app
#----------------------------------------------------------------------------

# FROM compile as run
FROM ubuntu:21.04

RUN apt-get update
RUN apt-get install -y ruby

COPY --from=compile /usr/local/bin/agent /usr/local/bin
COPY --from=compile /etc/mtconnect /etc/mtconnect

COPY test-agent.sh .

# define ports to listen on
EXPOSE 5000

# define default run command
# CMD ["agent", "debug", "/etc/ladder99-agent/agent.cfg"]
# CMD ["/usr/local/bin/agent", "debug", "/etc/mtconnect/agent/agent.cfg"]
# CMD ["agent", "debug", "/etc/mtconnect/agent/agent.cfg"]
CMD ["./test-agent.sh"]
