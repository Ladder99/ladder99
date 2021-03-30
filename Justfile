# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# install all dependencies (also need python, node/npm, docker, openjdk8, gradle2.8)
install:
    pip install mqtt-recorder
    npm install -g http-server
    cd services/adapter/code && npm install
    cd services/compiler/code && npm install
    cd services/simulator-mqtt/code && npm install
    cd services/simulator-opc/code && npm install
    cd services/diode/code/application/datadiode/contrib/nodejs && npm install

# install development tools
install-dev:
    brew install netcat
    pip install -U Sphinx

# make and deploy sphinx docs
docs:
    cd docs && make html && http-server build/html
    cd docs && firebase deploy

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

# start a setup with all services, e.g. `just run` or `just run demo`
run SETUP='demo':
    FILE=setups/{{SETUP}}/docker-compose.yaml && \
    docker-compose --file $FILE down && \
    docker-compose --file $FILE up --build --remove-orphans && \
    docker-compose --file $FILE rm -fsv

# replay mqtt recording - https://github.com/rpdswtk/mqtt_recorder
replay SETUP='demo' RUN='run0' PORT='1883':
    mqtt-recorder \
      --host localhost \
      --port {{PORT}} \
      --mode replay \
      --loop true \
      --file setups/{{SETUP}}/recordings/mqtt/{{RUN}}.csv

# ----------- diode -------------

# start rabbitmq message queues
rabbits:
    cd services/diode/code/application/datadiode/contrib/docker && \
    docker-compose up

# send a test message to rabbitmq
send:
    cd services/diode/code/application/datadiode/contrib/nodejs && \
    node src/send.js

# start diode sender
black:
    cd services/diode/code/application/datadiode/black && \
    gradle run

# start diode receiver
red:
    cd services/diode/code/application/datadiode/red && \
    gradle run
