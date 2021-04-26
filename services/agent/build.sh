#!/bin/bash

# mtconnect c++ agent
# build instructions for pi
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

# update package indexes
sudo apt-get update

# get dependencies
# i removed ruby.
sudo apt-get install -y \
  libxml2 libxml2-dev libcppunit-dev \
  cmake git build-essential screen curl

# get agent source
mkdir -p ~/agent/build && \
  cd ~/agent && \
  git clone https://github.com/mtconnect/cppagent.git --depth 1

# build makefile using cmake
cd ~/agent/build && \
  cmake \
  -D CMAKE_BUILD_TYPE=Release \
  ../cppagent/

# compile source (~20mins)
cd ~/agent/build && \
  make && \
  cp agent/agent /usr/local/bin

# WORKDIR /etc/mtconnect/agent-custom
# COPY data/agent .

# define ports to listen on
# EXPOSE 5000 7878

# define default run command
# CMD ["agent", "debug", "/etc/mtconnect/agent-custom/agent.cfg"]

agent debug /etc/mtconnect/agent-custom/agent.cfg
