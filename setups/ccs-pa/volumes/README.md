# volumes

These folders are exposed to the services through compose-ccs-pa.yaml.

Put anything the services will need here, but be careful you don't add too much to the repo - use .gitignore.

- agent - mtconnect agent settings - agent.cfg and devices.xml
- broker - mqtt broker
- grafana - visualization dashboard
- influxdb - timeseries db for raspberry pi monitoring
- portainer - docker container monitoring
- simulator-mqtt - record/playback mqtt data
- telegraf - feeds raspberry pi metrics to influxdb
- timescaledb - timeseries db for agent dataitem history
