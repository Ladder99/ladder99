# Configuration

Ladder99 is controlled by three main configuration files -

| name | description |
| ---- | ---- | 
| main docker-compose.yaml | default settings for all Ladder99 Docker services |
| setup docker-compose.yaml | override default settings for a setup |
| setup setup.yaml | tell Adapter, Relay, Meter services where to find devices, etc. |


## Main docker-compose.yaml

The main configuration file for Ladder99 is in `ladder99/services/docker-compose.yaml` - this tells Docker how to run the different services. Each service has a section, and they are listed alphabetically in the file - 

```yaml
# docker compose file for the complete ladder99 pipeline.
# can override these settings in setup-specific docker-compose.yaml files.

# see 'l99 start' for how to run

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
    image: ladder99/adapter:0.10.1
    profiles:
      - adapter
    environment:
      # specify where code can find data.
      # can override at run time, eg to run service on windows with node.
      L99_SETUP_FOLDER: /data/setup
      L99_ADAPTER_FOLDER: /data/adapter
    volumes:
      - ./$SETUP:/data/setup # has setup.yaml etc
      - ./$SETUP/volumes/adapter:/data/adapter # has json cookies for backfilling
    restart: always
    networks:
      - ladder99
    logging:
      options:
        max-size: '20m'
```

Note that each Ladder99 setup also has a `docker-compose.yaml` file, which overrides any settings in this main `docker-compose.yaml` file. See next section.

Link to the full file [here](../../../services/docker-compose.yaml).


## Setup docker-compose.yaml

This typically just specifies which services to include by default in the pipeline.

See [here](../customizing/configuration.md#docker-composeyaml)


## Setup setup.yaml

This tells services where to find devices, how long to retain information, etc.

See [here](../customizing/configuration.md#setupyaml)

