***********************
Developing Adapters
***********************

Model Files
==============

Device models are defined in the ``models`` folder, e.g. the CCS Print and Apply model is defined in ``models/ccs-pa`` - it has the following files:

- model.yaml
- inputs.yaml
- outputs.yaml
- types.yaml


Device Instances
================

The device instances are defined in the ``setups`` folder, eg the ``pi`` setup has a list of instances in the devices subfolder there. Edit these as needed.

Then generate the ``setups/pi/volumes/agent/devices.xml`` and ``setups/pi/docker/docker-compose.yaml`` files (former partially implemented, latter not implemented yet - hand-edit) -

   .. code:: console

      sh/setup/compile pi

Then copy the relevant data files into named volumes - 

   .. code:: console

      sh/adapter/copy pi
      sh/agent/copy pi

Then build the multiarchitecture Docker images - this will also push them to our Ladder99 Docker Hub. This can be done on another machine, as it can take a few hours if starting from scratch -

   .. code:: console

      sh/adapter/build
      sh/agent/build

Then start all the services with (where ``pi`` is the name of the setups folder, others correspond to docker-compose yamls in ``setups/pi/docker``) -

   .. code:: console

      sh/setups/start pi base sims db app

You can stop services with

   .. code:: console

      sh/setups/stop pi sims

To replay some more mqtt messages (not yet working),

   .. code:: console

      sh/setup/replay pi
