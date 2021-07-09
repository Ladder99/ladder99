# volumes

These folders are exposed to the services through pipeline.yaml.

Put anything the services will need here, but be careful you don't add too much to the repo - use .gitignore.

- agent - mtconnect agent settings - agent.cfg and devices.xml
- broker - mqtt broker
- database - timeseries db for agent dataitem history
- grafana - visualization dashboard
- influxdb - timeseries db for raspberry pi monitoring
- portainer - docker container monitoring
- recorder - record/playback mqtt data
- telegraf - feeds raspberry pi metrics to influxdb
