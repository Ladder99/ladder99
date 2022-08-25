# Services

Ladder99 is made up of several services that work together to form a data pipeline. Some have user-facing web pages, which can be accessed through the URLs below. 

| Service | Description | URL |
|---------|------------|---------|
| Adapter | polls/subscribes to devices, converts to text representation, sends to Agent |  |
| Agent | fits text representation into XML tree | http://localhost:5000 |
| Relay | polls Agent and writes new values to database |  |
| Postgres | database that stores device history in tables |  |
| Meter | polls data in database and writes statistics |  |
| Grafana | dashboard that queries data in database and displays graphs | http://localhost:80 |
| Dozzle | shows logs for the different services | http://localhost:8080 |
| Portainer | manages services - start/stop etc | http://localhost:9000 |
| Pgadmin | manages database | http://localhost:5050 |


## Compose.yaml

The main configuration file for Ladder99 is in `ladder99/services/compose.yaml` - this tells Docker how to run the different services. 

```yaml
# docker compose file for the complete ladder99 pipeline.
# can override these settings in setup-specific compose-overrides.yaml files.

# see ./l99 start for how to run

# docker compose yaml version - must be a string
# see https://docs.docker.com/compose/compose-file/compose-file-v3
# note: a '3' here means '3.0'
version: '3.8'

services:
  # ---------------------------------------------------------------------------
  # adapter
  # ---------------------------------------------------------------------------
  # convert machine data to shdr and send to agent
  adapter:
    container_name: adapter
    # image: ladder99/adapter:latest # use this if build docker image and push to hub
    build: ./adapter # see Dockerfile in this folder
    # set this to give permission to access hardware (e.g. dymo scale in usb port).
    #. security hole - leave off for now, until need dymo driver.
    # privileged: true
    profiles:
      - adapter
    environment:
      # specify where code can find data.
      # can override at run time, eg to run service on windows with node.
      L99_SETUP_FOLDER: /data/setup
      L99_MODULES_FOLDER: /data/modules
      L99_ADAPTER_FOLDER: /data/adapter
    volumes:
      - ../$SETUP:/data/setup # has setup.yaml etc
      - ../setups/common/modules:/data/modules # has module yamls
      - ../$SETUP/volumes/adapter:/data/adapter # has json cookies for backfilling
    restart: always
    networks:
      - ladder99
    logging:
      options:
        max-size: '20m'
```

with one section for each service. 

Link to the full compose.yaml for Ladder99 [here](../../services/compose.yaml).

