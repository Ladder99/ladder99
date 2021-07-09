# Setups

A setup defines the devices in a network, their models, and configuration settings for the pipeline services.

The pipeline service defaults are set in pipeline.yaml - each setup should have a config folder with a setup.yaml and any pipeline setting overrides in overrides.yaml.

**vmc** is the 'default' setup, which comes with the MTConnect Agent - it supplies simulation data to the agent, which can be viewed in a browser.

**ccs-pa** is a work in progress, the main testing ground for the pipeline.

**mazak-mill** is another work in progress.

**dev** is for development work on the agent html output.
