# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# convert device.yamls to devices.xml
devices:
    cd parts/devices && node code/src/index.js config/device-ccs-pa.yaml | tee config/devices.xml
    cp parts/devices/config/devices.xml parts/agent/config

# start containers
up:
    docker-compose down && docker-compose up --build

# stop containers
down:
    docker-compose down

# run device simulator
simulator:
    docker-compose run simulator
