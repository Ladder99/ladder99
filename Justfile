# use with https://github.com/casey/just

help:
    @just --list

# convert devices.yaml to xml
make:
    cd parts/elevator && node code/src/index.js config/devices.yaml > config/devices.xml
    cp parts/elevator/config/devices.xml parts/agent/config

# start containers
up:
    docker-compose down && docker-compose up --build
