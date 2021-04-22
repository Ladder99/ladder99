# mtconnect c++ agent
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu
# divide into stages with FROM ... AS ..., so docker can cache intermediate steps,
# which are slow.


# get base
# this ubuntu has linux/arm/v7, linux/amd64
# see https://hub.docker.com/layers/ubuntu/library/ubuntu/20.04/images/sha256-b30065ff935c7761707eab66d3edc367e5fc1f3cc82c2e4addd69cee3b9e7c1c?context=explore
FROM ubuntu:20.04 AS make-os

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


# start the makefile step
FROM make-os as make-makefile

# get agent source
RUN mkdir -p ~/agent/build && \ 
  cd ~/agent && \
  git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
RUN cd ~/agent/build && \
  cmake \
  -D CMAKE_BUILD_TYPE=Release \
  -D CMAKE_VERBOSE_MAKEFILE=ON \
  ../cppagent/


# start the compile step
FROM make-makefile as compile

# compile source
RUN cd ~/agent/build && \
  make && \
  cp agent/agent /usr/local/bin


# start the run step
FROM compile as run

# setup agent
# RUN mkdir -p /etc/mtconnect/agent && \
#   cd ~/agent/cppagent && \
#   cp -r styles schemas /etc/mtconnect/agent
RUN mkdir -p /etc/mtconnect/agent && \
  echo hi

# FROM ubuntu:18.04
# COPY --from=tempBuildImage /home/app /home/app

# define ports to listen on
EXPOSE 5000 7878

# define default run command
CMD ["agent", "debug", "/etc/mtconnect/agent/agent.cfg"]
