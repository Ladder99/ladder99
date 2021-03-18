# use with https://github.com/casey/just
# like make, but just a command runner

# list targets
help:
    @just --list

# build devices.xml and device*.js files from device*.yaml files
devices: buildxml buildjs

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

# start containers
# eg `just run demo`
# rm options:
# -f, --force   Don't ask to confirm removal
# -s, --stop    Stop the containers, if required, before removing
# -v            Remove any anonymous volumes attached to containers
# docker-compose up --build --remove-orphans && \
# SETUP is a variable, the name of the setup folder to use
run SETUP:
    FILE=config/setups/{{SETUP}}/generated/docker-compose.yaml && \
    docker-compose --file $FILE --project-directory . down && \
    docker-compose --file $FILE --project-directory . up --build --remove-orphans && \
    docker-compose --file $FILE --project-directory . rm -fsv

# make sphinx docs
# needs sphinx - `pip install -U Sphinx`
# needs http-server - `npm install -g http-server`
docs:
    cd docs && make html && http-server build/html

# deploy sphinx docs
docs-upload:
    cd docs && firebase deploy
