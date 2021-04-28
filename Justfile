#-------------------------------------------------------------------------
# use with https://github.com/casey/just
# like make, but just a command runner
#-------------------------------------------------------------------------

# list targets
help:
    @just --list

# install all dependencies (also need python, node/npm, docker, jq, openjdk8, gradle2.8)
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

# compile-xml and compile-compose
compile SETUP='demo':
    just compile-xml {{SETUP}}
    just compile-compose {{SETUP}}

# compile devices.xml from model devices.yaml
compile-xml SETUP='demo':
    node services/compiler/src/compile-xml.js \
    setups/{{SETUP}}/devices.yaml \
    setups/{{SETUP}}/volumes/agent/devices.xml

# compile docker-compose.yaml from devices.yaml
compile-compose SETUP='demo':
    echo todo

# run
# SETUP is a variable, the name of the setup folder to use
# rm options:
# -f, --force   Don't ask to confirm removal
# -s, --stop    Stop the containers, if required, before removing
# -v            Remove any anonymous volumes attached to containers
# ----
# start a setup with all services, e.g. `just run` or `just run demo`
run SETUP='demo' SERVICE='':
    # just compile {{SETUP}}
    FILE=setups/{{SETUP}}/docker/docker-compose.yaml && \
    docker-compose --file $FILE down && \
    docker-compose --file $FILE up --build --remove-orphans {{SERVICE}} && \
    docker-compose --file $FILE rm -fsv

# replay mqtt recording - https://github.com/rpdswtk/mqtt_recorder
replay MODEL='ccs-pa' RUN='run0' PORT='1883':
    mqtt-recorder \
      --host localhost \
      --port {{PORT}} \
      --mode replay \
      --loop true \
      --file models/{{MODEL}}/simulations/{{RUN}}.csv


#-------------------------------------------------------------------------
# docker images
#-------------------------------------------------------------------------

# do `docker login -u mriiotllc` if permission denied
# do `docker buildx create --use` if error "multiple platforms not supported"
#---
# note: the image won't show up in `docker images` because it's multiarch
#---
# test and look around with this -
#   docker run -it mriiotllc/ladder99-adapter:0.1.0 /bin/bash
#   npm start  # will get error due to missing devices.yaml
#. or docker run :latest if can ignore cache
#---
# build and upload adapter image
build-adapter:
    cd services/adapter && \
    export L99_ADAPTER_VERSION=`jq -r .version package.json` && \
    docker buildx build \
      --platform linux/arm/v7,linux/amd64 \
      --tag=mriiotllc/ladder99-adapter:latest \
      --tag=mriiotllc/ladder99-adapter:$L99_ADAPTER_VERSION \
      --push \
      .

# copy yaml files to pi
deploy-adapter SETUP='pi':
    source pi.sh && \
    $ENTERPWD ssh $PI "sudo mkdir -p /etc/ladder99-adapter" && \
    $ENTERPWD ssh $PI "sudo chown pi:pi /etc/ladder99-adapter" && \
    $ENTERPWD scp -p setups/{{SETUP}}/devices.yaml $PI:/etc/ladder99-adapter && \
    $ENTERPWD scp -pr models $PI:/etc/ladder99-adapter/models

# note: the image won't show up in `docker images` because it's multiarch
#---
# build and upload agent image, eg `just build-agent linux/amd64,linux/arm/v7`
#      --platform {{PLATFORM}} \
# build-agent PLATFORM='linux/amd64':
build-agent:
    cd services/agent && \
    export L99_AGENT_VERSION=`jq -r .version package.json` && \
    docker buildx build \
      --platform linux/arm/v7,linux/amd64 \
      --tag=mriiotllc/ladder99-agent:latest \
      --tag=mriiotllc/ladder99-agent:$L99_AGENT_VERSION \
      --push \
      .

# copy xml and style files to pi
deploy-agent SETUP='pi':
    source pi.sh && \
    $ENTERPWD ssh $PI "sudo mkdir -p /etc/ladder99-agent" && \
    $ENTERPWD ssh $PI "sudo chown pi:pi /etc/ladder99-agent" && \
    $ENTERPWD scp -rp setups/{{SETUP}}/volumes/agent/* $PI:/etc/ladder99-agent


#-------------------------------------------------------------------------
# diode (java/rabbitmq)
#-------------------------------------------------------------------------

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
