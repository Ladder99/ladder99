#!/bin/bash

# install apps on pi

# install just - a command runner like make
# see https://github.com/casey/just
#. this grabs 64-bit version - no 32-bit avail in his releases yet. 
# see https://github.com/casey/just/issues/739
# uses go cargo to build?
# curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | \
#   sudo bash -s -- --to /usr/local/bin

# install docker-compose - not yet in docker command
sudo pip3 install docker-compose
