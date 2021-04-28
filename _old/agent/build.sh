#!/bin/bash

# mtconnect c++ agent build instructions for pi
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

#. these don't work directly on the pi - get errors with gcc8,9,10. 
# need to build within docker. weird. 



# increase memory available - need for building dlib on the pi.

# Note: Increasing swap size is a great way to burn out your Raspberry Pi card.
# https://www.pyimagesearch.com/2017/05/01/install-dlib-raspberry-pi/
# https://pimylifeup.com/raspberry-pi-swap-file/

# $ sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=100 => 1000

# restart swap:
# $ sudo /etc/init.d/dphys-swapfile stop
# $ sudo /etc/init.d/dphys-swapfile start
# $ free -mh

# COMPILE

# THEN PUT SWAP SIZE BACK TO 100!



sudo apt update
sudo apt upgrade

sudo apt install -y \
  libxml2 libxml2-dev libcppunit-dev cmake git build-essential screen curl

# get gcc10 - gcc8.3 doesn't handle c++17 stuff (eg std:filesystem)
# from https://solarianprogrammer.com/2017/12/08/raspberry-pi-raspbian-install-gcc-compile-cpp-17-programs/
# and https://gist.github.com/sol-prog/95e4e7e3674ac819179acf33172de8a9
# see also https://linuxize.com/post/how-to-install-gcc-on-ubuntu-20-04/
cd ~
git clone https://bitbucket.org/sol_prog/raspberry-pi-gcc-binary.git
cd raspberry-pi-gcc-binary
tar -xjvf gcc-10.1.0-armhf-raspbian.tar.bz2
sudo mv gcc-10.1.0 /opt
tar -xjvf gcc-9.1.0-armhf-raspbian.tar.bz2
sudo mv gcc-9.1.0 /opt
cd ..
rm -rf raspberry-pi-gcc-binary

cd ~
echo 'export PATH=/opt/gcc-10.1.0/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/gcc-10.1.0/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
echo 'export PATH=/opt/gcc-9.1.0/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/gcc-9.1.0/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
. ~/.bashrc

sudo ln -s /usr/include/arm-linux-gnueabihf/sys /usr/include/sys
sudo ln -s /usr/include/arm-linux-gnueabihf/bits /usr/include/bits
sudo ln -s /usr/include/arm-linux-gnueabihf/gnu /usr/include/gnu
sudo ln -s /usr/include/arm-linux-gnueabihf/asm /usr/include/asm
sudo ln -s /usr/lib/arm-linux-gnueabihf/crti.o /usr/lib/crti.o
sudo ln -s /usr/lib/arm-linux-gnueabihf/crt1.o /usr/lib/crt1.o
sudo ln -s /usr/lib/arm-linux-gnueabihf/crtn.o /usr/lib/crtn.o

# then select gcc10 as current version
# see https://raspberrypi.stackexchange.com/questions/93597/problem-with-gcc-g-versions/93598#93598
sudo update-alternatives --install /usr/bin/gcc gcc /opt/gcc-10.1.0/bin/gcc-10.1 60 --slave /usr/bin/g++ g++ /opt/gcc-10.1.0/bin/g++-10.1
sudo update-alternatives --install /usr/bin/gcc gcc /opt/gcc-9.1.0/bin/gcc-9.1 60 --slave /usr/bin/g++ g++ /opt/gcc-9.1.0/bin/g++-9.1
sudo update-alternatives --config gcc
sudo update-alternatives --config g++


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

# run agent
agent debug /etc/ladder99-agent/agent.cfg
