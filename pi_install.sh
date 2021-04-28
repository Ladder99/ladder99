#!/bin/bash

# install apps on pi

# install just - a command runner like make
# see https://github.com/casey/just
#. this grabs 64-bit version - no 32-bit avail in his releases yet. 
# see https://github.com/casey/just/issues/739
# uses go cargo to build?
# curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | \
#   sudo bash -s -- --to /usr/local/bin

# install and upgrade docker
# see https://docs.docker.com/engine/install/debian/#install-using-the-convenience-script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt upgrade docker

# install libseccomp to fix docker bug
# because when compile with docker get errors - 
# "At least one invalid signature was encountered."
# see https://askubuntu.com/questions/1263284/apt-update-throws-signature-error-in-ubuntu-20-04-container-on-arm#
wget http://ftp.us.debian.org/debian/pool/main/libs/libseccomp/libseccomp2_2.5.1-1_armhf.deb
sudo dpkg -i libseccomp2_2.5.1-1_armhf.deb

# install docker-compose - not yet in docker command
sudo pip3 install docker-compose

# allow pi user to run docker
sudo usermod -aG docker pi

echo Now restart terminal - otherwise must use sudo with docker commands. 
