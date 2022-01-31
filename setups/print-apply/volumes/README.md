# volumes

These folders are exposed to the services through compose.yaml.

Put anything the services will need here, but be careful you don't add too much to the repo - use .gitignore.

- agent - mtconnect agent settings - agent.cfg and agent.xml
- grafana - visualization dashboard
- mosquitto - mqtt broker
- portainer - docker container monitoring
- postgres - timeseries db for agent dataitem history
