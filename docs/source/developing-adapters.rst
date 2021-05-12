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

The device instances are defined in the ``setups`` folder, eg the ``ccs-pa`` setup has a list of instances in the devices subfolder there. Edit these as needed.

Then generate the ``setups/ccs-pa/volumes/agent/devices.xml`` and ``setups/ccs-pa/docker/*.yaml`` files (former partially implemented, latter not implemented yet - hand-edit) -

   .. code:: console

      shell/setup/compile ccs-pa

Then copy the relevant data files into named volumes - 

   .. code:: console

      shell/adapter/copy ccs-pa
      shell/agent/copy ccs-pa

Then build the multiarchitecture Docker images - this will also push them to our Ladder99 Docker Hub. This can be done on another machine, as it can take a few hours if starting from scratch -

   .. code:: console

      shell/adapter/build
      shell/agent/build

Then start all the services with (where ``ccs-pa`` is the name of the setups folder, others correspond to docker-compose yamls in ``setups/ccs-pa/docker``) -

   .. code:: console

      shell/setups/start ccs-pa base sims db app

You can stop services with

   .. code:: console

      shell/setups/stop ccs-pa sims

To replay some more mqtt messages (not yet working),

   .. code:: console

      shell/setup/replay ccs-pa
