# Configuration

## Setup.yaml

Now have a look inside the main configuration file, `../setup-test/setup.yaml` - 

First note the **adapter** section - this specifies the device drivers to feed to our Agent. In this case, we have a microcontroller driver, which reads some stats of the local/host computer. 

```yaml
# ladder99 adapter reads this section to know what devices to poll/subscribe to.
adapter:
  devices:
    - id: m # must match id in agent.xml
      name: Micro # this must match name in agent.cfg and agent.xml
      # sources define the inputs to the cache.
      sources:
        - module: micro # module defines inputs and outputs with yaml files
          driver: micro # adapter plugin - manages protocol and payload
      # where agent will connect to adapter
      connection:
        host: adapter # must match agent.cfg value
        port: 7890 # must match agent.cfg value
```

Next, note the **relay** section, which tells the relay which agents to query before passing the data on to the database. 

```yaml
# ladder99 relay reads this section to know what agents and devices to read data from.
# warning: don't change the agent aliases (eg Main) as they are used to synch data with db.
relay:
  # retention: 1wk # could specify a top-level retention for all agents here
  agents:
    - alias: Main # this is an arbitrary alias we assign to each agent, used by the db - don't change!
      url: http://agent:5000 # url to the agent
      # ignore: true # can specify this to turn agent recording on/off
      # retention: 2d # could clear all unneeded data at midnight - then vacuum analyze db?
      # without a list of devices here, relay would read all available in agent
      devices:
        - id: m # must match id in agent.xml
          alias: Microcontroller # as displayed in grafana - can change. without this, just use device name?
          # ignore: true # can specify this to turn device recording on/off
          # could override settings per dataitem -
          # dataitems:
          #   - id: m-os
          #     retention: 1d

    - alias: Mazak5701 # assigned agent alias - don't change!
      url: http://mtconnect.mazakcorp.com:5701
      devices:
        - id: d1 # must match id in agent.xml
          alias: MazakMill12345 # used in path expressions - no spaces!
          # ignore: true # set true to hide device in dashboards, pause recording, etc
          # dataitem step translations
          translations:
            base: axes
            Cload: load-index
            Sload: load-spindle
          # ignore or set retention for individual dataitems
          dataitems:
            - id: d1-auto_time
              ignore: true
            - id: d1-total_time
              ignore: true
            - id: d1-cut_time
              ignore: true
            - id: d1-total_auto_cut_time
              ignore: true
```


## Compose-overrides.yaml

Another file with configuration settings is `../setup-test/compose-overrides.yaml`. This contains extra configuration for Docker - in this case, mostly just telling it to run all services with a profile name of 'base'. 

```yaml
# docker-compose overrides
# overrides and extends the values in ladder99/services/compose.yaml

# see other client repos for ideas for adding information to services.
# typically, would add 'profiles: - base' to each service used.
# that way, we know what is needed, and can start them all with
#   ./l99 start <setup> base

# version must be a string - need 3.8 for profiles
version: '3.8'

services:
  adapter:
    profiles:
      - base
  agent:
    profiles:
      - base
  dozzle:
    profiles:
      - base
  grafana:
    profiles:
      - base
  # meter:
  #   profiles:
  #     - base
  portainer:
    profiles:
      - base
  postgres:
    profiles:
      - base
  pgadmin:
    profiles:
      - base
  relay:
    profiles:
      - base
```

This lets us run `./l99 start example`, which by default runs the profile 'base' - though you can also say `./l99 start example agent`, to run only the agent service, for example.


## Compose.yaml

The main Docker configuration file is in `ladder99/services/compose.yaml` - 

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

etc, with one section per service. 

