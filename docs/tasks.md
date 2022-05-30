# Tasks

## Clearing up disk space

docker system prune didn't work? must use `rm -r /var/lib/docker`

it seems to be a bug with devicemapper
https://github.com/moby/moby/issues/3182

    docker stop adapter agent backup dozzle grafana meter mosquitto nodered pgadmin portainer postgres relay traefik
    sudo systemctl stop docker
    sudo rm -rf /var/lib/docker
    sudo systemctl start docker
    ./start oxbox all prod

eg on oxbox 001 - 

    $ df
    97%
    whoa 97% full

    $ sudo rm -rf /var/lib/docker

    $ df
    35%
    seems high still - didn't realize mosquitto logs were so big

    build all images - takes 30mins
    $ ./start oxbox all prod

    $ df
    52%
    images and containers

    what's in volumes?

    $ sudo du -d1 -h ../client-oxbox/volumes/
    99M     ../client-oxbox/volumes/agent
    5.7G    ../client-oxbox/volumes/mosquitto
    1.2G    ../client-oxbox/volumes/postgres
    73M     ../client-oxbox/volumes/nodered
    429M    ../client-oxbox/volumes/backup
    7.5G    ../client-oxbox/volumes/

    whoa - mosquitto is chewing up disk space
    turned off logfile in mosquitto.conf

    [pi@001-oxbox ~/ladder99/client-oxbox/volumes/mosquitto]
    $ sudo rm log/mosquitto.log

    $ df -h
    31%
    so mosquitto.log was 21% of space!

    now at 8gb used. 
    1.2gb of that is the db
    would be ~1gb smaller if cleared out the microcontroller data, which did on 004. 


## Fixing vulnerabilities

for nodejs services (adapter, compiler, meter, recorder, relay), whenever you start a service it will fix any known security vulnerabilities, where possible.

when you run something like `./start oxbox relay`, it builds the docker image and runs a container using the associated [Dockerfile](../services/relay/Dockerfile).

that build will do a fresh install of all the packages defined in packages.json, and do an audit to look for known security vulnerabilities, and apply upgrades where possible.

the Dockerfiles use node LTS, which is currently on version 16, and will be supported until 2024-04-30
