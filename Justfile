# use with https://github.com/casey/just

help:
    @just --list

# convert device.yamls to xml
make:
    cd parts/devices && node code/src/index.js config/devices.yaml > config/devices.xml
    cp parts/devices/config/devices.xml parts/agent/config

# start containers
up:
    docker-compose down && docker-compose up --build

# stop containers
down:
    docker-compose down

device:
    docker-compose run device
