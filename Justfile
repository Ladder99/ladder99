#-------------------------------------------------------------------------
# use with https://github.com/casey/just
# like make, but just a command runner
# not avail for raspberry pi yet - https://github.com/casey/just/issues/739
#-------------------------------------------------------------------------

# note: this automatically reads environment variables from an .env file.
# or, it's supposed to - currently need to say `source .env`.

# this command will enter passwords at the command line
# usage: $enterpwd <command text>
# see https://github.com/clarkwang/passh
export enterpwd := "./bin/macos/passh -p env:PI_PASSWORD"

# list targets
help:
    @just --list

# install all dependencies (also need python, node/npm, docker, jq, openjdk8, gradle2.8)
install:
    pip install mqtt-recorder
    npm install -g http-server
    cd services/adapter && npm install
    cd services/application && npm install
    cd services/compiler && npm install
    cd services/simulator-mqtt && npm install
    cd services/simulator-opc && npm install
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
    docker compose --file $FILE down && \
    docker compose --file $FILE up --build --remove-orphans {{SERVICE}} && \
    docker compose --file $FILE rm -fsv

# replay mqtt recording - https://github.com/rpdswtk/mqtt_recorder
replay MODEL='ccs-pa' RUN='run0' PORT='1883':
    mqtt-recorder \
      --host localhost \
      --port {{PORT}} \
      --mode replay \
      --loop true \
      --file models/{{MODEL}}/simulations/{{RUN}}.csv

# run the mtconnect application, which polls the agent
run-app:
    cd services/application && npm start

test-app:
    cd services/application && npm test


#-------------------------------------------------------------------------
# docker images
#-------------------------------------------------------------------------

# do `docker login --user ladder99` if permission denied
# do `docker buildx create --use` if error "multiple platforms not supported"
#---
# note: the image won't show up in `docker images` because it's multiarch
#---
# test and look around with this -
#   docker run -it ladder99/mtconnect-adapter:0.1.0 /bin/bash
#   npm start  # will get error due to missing devices.yaml
#. or docker run :latest if can ignore cache
#---
# build and upload adapter image
build-adapter:
    cd services/adapter && \
    export L99_ADAPTER_VERSION=`jq -r .version package.json` && \
    docker buildx build \
      --platform linux/arm/v7,linux/arm64,linux/amd64 \
      --tag=ladder99/adapter:latest \
      --tag=ladder99/adapter:$L99_ADAPTER_VERSION \
      --push \
      .

# note: we set the destination directory's group and owner to pi, 
# so can copy to it with scp.
#. how do this for local testing also? ie mkdirs and copy yamls to ~/data
#---
# copy yaml files to pi - envars are set in .env file
deploy-adapter SETUP='pi':
    source .env && \
    $enterpwd ssh $PI "sudo mkdir -p ~/data/adapter" && \
    $enterpwd ssh $PI "sudo chown pi:pi ~/data/adapter" && \
    $enterpwd scp -p setups/{{SETUP}}/devices.yaml $PI:~/data/adapter && \
    $enterpwd scp -pr models $PI:~/data/adapter/models

# note: the image won't show up in `docker images` because it's multiarch
#---
# build and upload agent image, eg `just build-agent linux/amd64,linux/arm/v7,linux/arm64`
build-agent PLATFORM='linux/amd64' SUFFIX='-amd64':
    cd services/agent && \
    export L99_AGENT_VERSION=`jq -r .version package.json` && \
    docker buildx build \
      --platform {{PLATFORM}} \
      --tag=mriiotllc/ladder99-agent:latest{{SUFFIX}} \
      --tag=mriiotllc/ladder99-agent:$L99_AGENT_VERSION{{SUFFIX}} \
      --push \
      .

build-agent-test:
    cd services/agent \
    && docker build --tag pokpok .

# note: we set the destination directory's group and owner to pi, 
# so can copy to it with scp.
#---
# copy xml and style files to pi - envars are set in .env file
deploy-agent SETUP='pi':
    source .env && \
    $enterpwd ssh $PI "sudo mkdir -p /etc/ladder99-agent" && \
    $enterpwd ssh $PI "sudo chown pi:pi /etc/ladder99-agent" && \
    $enterpwd scp -rp setups/{{SETUP}}/volumes/agent/* $PI:/etc/ladder99-agent


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
