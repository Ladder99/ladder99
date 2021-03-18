# use with https://github.com/casey/just
# like make, but just a command runner

default_setup := 'demo'

# list targets
help:
    @just --list

# install all dependencies #. also python, node/npm
install:
    pip install -U Sphinx
    npm install -g http-server
    pip install mqtt-recorder
    cd services/adapter/code && npm install
    cd services/builder/code && npm install
    cd services/simulator/code && npm install

# build devices.xml and device*.js files from device*.yaml files
build: _buildxml _buildjs

# build devices.xml from device*.yaml files
_buildxml:
    node services/builder/code/src/buildXml.js setups/demo/devices/*.yaml | \
    tee setups/demo/devices.xml
    cp setups/demo/devices.xml setups/demo/volumes/agent/config

# build device*.js files from device*.yaml files
_buildjs:
    for filename in setups/demo/devices/*.yaml; \
    do \
        node services/builder/code/src/buildJs.js "$filename" | \
          tee "setups/demo/devices/$(basename $filename .yaml).js" ; \
    done
    cp services/builder/output/*.js services/adapter/code/src/plugins

# run
# SETUP is a variable, the name of the setup folder to use
# rm options:
# -f, --force   Don't ask to confirm removal
# -s, --stop    Stop the containers, if required, before removing
# -v            Remove any anonymous volumes attached to containers
#. run SETUP: build

# start a setup with all services, e.g. `just run` or `just run demo`
run SETUP=default_setup:
    FILE=setups/{{SETUP}}/docker-compose.yaml && \
    docker-compose --file $FILE down && \
    docker-compose --file $FILE up --build --remove-orphans && \
    docker-compose --file $FILE rm -fsv

# make and deploy sphinx docs
docs:
    cd docs && make html && http-server build/html
    cd docs && firebase deploy

# replay ccs p&a mqtt recording - https://github.com/rpdswtk/mqtt_recorder
replay SETUP=default_setup:
    mqtt-recorder \
      --host localhost \
      --port 1883 \
      --mode replay \
      --loop true \
      --file setups/{{SETUP}}/volumes/simulator/mqtt-recording.csv
