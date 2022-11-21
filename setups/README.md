# Setups

A setup defines the devices in a network, the drivers and schemas used to connect them, and configuration settings for the pipeline services.

The pipeline service defaults are set in `services/docker-compose.yaml` - each setup should have a `setup.yaml` file and any pipeline setting overrides in a `docker-compose.yaml` file.
