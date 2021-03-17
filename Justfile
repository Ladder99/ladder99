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
    cp parts/devices/output/*.js parts/adapter/code/src/plugins

# start containers
# rm options:
# -f, --force   Don't ask to confirm removal
# -s, --stop    Stop the containers, if required, before removing
# -v            Remove any anonymous volumes attached to containers
up:
    docker-compose down && \
    docker-compose up --build --remove-orphans && \
    docker-compose rm -fsv

# stop containers
down:
    docker-compose down

# # run device simulator
# simulator:
#     docker-compose run simulator

# make docs
# needs sphinx - `pip install -U Sphinx`
# needs http-server - `npm install -g http-server`
docs:
    cd docs && make html && http-server build/html
