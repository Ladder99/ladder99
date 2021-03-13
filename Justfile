# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# process device.yaml files to devices.xml and device*.js files
devices: getxml getjs

# build devices.xml from device.yaml files
getxml:
    cd parts/devices && node code/src/index.js input/*.yaml output && \
    cp parts/devices/output/devices.xml parts/agent/config

# build device*.js files from device.yaml files
getjs:
    cd parts/devices && node code/src/getjs.js input/*.yaml output && \
    cp parts/devices/output/*.js parts/adapter/plugins

# start containers
up:
    docker-compose down && docker-compose up --build

# stop containers
down:
    docker-compose down

# run device simulator
simulator:
    docker-compose run simulator
