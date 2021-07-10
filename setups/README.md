# Setups

A setup defines the devices in a network, their models, and configuration settings for the pipeline services.

The pipeline service defaults are set in pipeline.yaml - each setup should have a config folder with a devices.yaml file and any pipeline setting overrides in overrides.yaml.

## Folders

**vmc** is the 'default' setup, which comes with the MTConnect Agent - it supplies simulation data to the agent, which can be viewed in a browser.

**ccs-pa** is the main testing ground for the pipeline, a work in progress.

**mazak-mill** is another work in progress.

**dev** is for development work on the agent html output.
