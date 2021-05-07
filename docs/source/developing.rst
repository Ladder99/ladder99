******************
Developing
******************




Model Files
==============

Device models are defined in the ``models`` folder, e.g. the CCS Print and Apply model is defined in ``models/ccs-pa`` - it has the following files:

- model.yaml
- inputs.yaml
- outputs.yaml
- types.yaml


Device Instances
================

The device instances are defined in the ``setups`` folder, eg the ``demo`` setup has a list of instances in the devices subfolder there. Edit these as needed.


Then generate the ``setups/demo/volumes/agent/devices.xml`` and ``setups/demo/docker/docker-compose.yaml`` files (former partially implemented, latter not implemented yet - hand-edit) -

    sh/setup/compile pi

Then copy the relevant data files into named volumes - 

    sh/adapter/copy pi
    sh/agent/copy pi

Then build the multiarchitecture Docker images - this will also push them to our Ladder99 Docker Hub. This can be done on another machine, as it can take a few hours if starting from scratch -

    sh/adapter/build
    sh/agent/build

Then start all the services with (where pi is the name of the setups folder) -

    sh/setups/up pi base sims db app

or to run some services on the pi, some elsewhere, etc -

    sh/setups/up pi base sims
    sh/setups/up pi db
    sh/setups/up pi app

You can stop services with

    sh/setups/down pi sims


To replay some more mqtt messages,

    sh/setup/replay pi

(not yet working)


