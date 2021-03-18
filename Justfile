# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# install all dependencies #. also python, node/npm
install:
    pip install -U Sphinx
    npm install -g http-server
    cd services/adapter/code && npm install
    cd services/builder/code && npm install
    cd services/simulator/code && npm install

# build devices.xml and device*.js files from device*.yaml files
build: buildxml buildjs

# build devices.xml from device*.yaml files
buildxml:
    node services/builder/code/src/buildXml.js config/models/*.yaml | \
    tee services/builder/output/devices.xml
    cp services/builder/output/devices.xml services/agent/config

# build device*.js files from device*.yaml files
buildjs:
    cd services/builder && \
    for filename in input/*.yaml; \
    do \
        node code/src/buildJs.js "$filename" | \
          tee "output/$(basename $filename .yaml).js" ; \
    done
    cp services/builder/output/*.js services/adapter/code/src/plugins

# run
# SETUP is a variable, the name of the setup folder to use
# rm options:
# -f, --force   Don't ask to confirm removal
# -s, --stop    Stop the containers, if required, before removing
# -v            Remove any anonymous volumes attached to containers
#. run SETUP: build

# start a setup with all services, e.g. `just run demo`
run SETUP:
    FILE=setups/{{SETUP}}/docker-compose.yaml && \
    docker-compose --file $FILE down && \
    docker-compose --file $FILE up --build --remove-orphans && \
    docker-compose --file $FILE rm -fsv

# make and deploy sphinx docs
docs:
    cd docs && make html && http-server build/html
    cd docs && firebase deploy
