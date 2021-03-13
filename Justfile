# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# build devices.xml and device*.js files from device*.yaml files
devices: getxml getjs

# build devices.xml from device*.yaml files
getxml:
    cd parts/devices && \
    node code/src/getxml.js input/*.yaml | tee output/devices.xml
    cp parts/devices/output/devices.xml parts/agent/config

# build device*.js files from device*.yaml files
getjs:
    cd parts/devices && \
    for filename in input/*.yaml; \
    do \
        node code/src/getjs.js "$filename" | \
          tee "output/$(basename $filename .yaml).js" ; \
    done
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
