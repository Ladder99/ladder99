# use with https://github.com/casey/just
# like make, but just a command runner

# default_setup := 'demo'

# list targets
help:
    @just --list

# install all dependencies (also need python, node/npm, docker)
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
run SETUP='demo':
    FILE=setups/{{SETUP}}/docker-compose.yaml && \
    docker-compose --file $FILE down && \
    docker-compose --file $FILE up --build --remove-orphans && \
    docker-compose --file $FILE rm -fsv

# make and deploy sphinx docs
docs:
    cd docs && make html && http-server build/html
    cd docs && firebase deploy

# replay ccs p&a mqtt recording - https://github.com/rpdswtk/mqtt_recorder
replay SETUP='demo':
    mqtt-recorder \
      --host localhost \
      --port 1883 \
      --mode replay \
      --loop true \
      --file setups/{{SETUP}}/mqtt-recorder/recording.csv


# install openjdk8
# install gradle2.8


# To enable strong encryption (AES-256) see 
# * [Java-6 JCE](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
# * [Java-7 JCE](http://www.oracle.com/technetwork/java/javase/downloads/jce-7-download-432124.html)
# * [Java-8 JCE](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)
# Install unzip the JCE and place the jars in $JAVA_HOME/jre/lib/security:
#     cp *.jar $JAVA_HOME/jre/lib/security

# install JCE
install-jce:
    cd ~/Desktop/UnlimitedJCEPolicyJDK8 && \
    sudo cp *.jar $JAVA_HOME/jre/lib/security

# or
# docker-compose --file services/diode/code/application/datadiode/contrib/docker/docker-compose.yml up

# start rabbitmq message queues
rabbit:
    cd services/diode/code/application/datadiode/contrib/docker && \
    docker-compose up

# send a test message to rabbitmq
send:
    cd services/diode/code/application/datadiode/contrib/nodejs && \
    npm install && \
    node src/send.js


#. do we need this?
# # build data diode
# build-diode:
#     @echo must do this first - 
#     @echo   export DOCKER_BUILDKIT=0
#     @echo   export COMPOSE_DOCKER_CLI_BUILD=0
#     @echo see https://stackoverflow.com/a/66695181/243392
#     cd services/diode && \
#     docker build -t diode .

# cd services/diode && docker-compose up
# docker run diode /bin/bash -c "cd application/datadiode/black && gradle run"

# start diode sender and receiver
diode: _black _red

# start diode sender
_black:
    cd services/diode/code/application/datadiode/black && \
    gradle run

# start diode receiver
_red:
    cd services/diode/code/application/datadiode/red && \
    gradle run

