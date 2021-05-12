***********************
Developing Adapters
***********************

Model Files
==============

Device models are defined in the ``models`` folder, e.g. the CCS Print and Apply model is defined in ``models/ccs-pa`` - it has the following files:

- model.yaml - defines the structure of the xml that is included in devices.xml, which is fed to the mtconnect agent
- inputs.yaml - defines how to parse mqtt messages using the mqtt-json plugin, which writes values to a key-value cache
- outputs.yaml - defines the shdr strings that are calculated from the cache and sent on to the agent
- types.yaml - (optional) used by outputs.yaml


Device Instances
================

The device instances are defined in the ``setups`` folder, eg the ``ccs-pa`` setup has a list of instances in the devices subfolder there. Edit these as needed.

Then generate the ``setups/ccs-pa/volumes/agent/devices.xml`` and ``setups/ccs-pa/docker/*.yaml`` files (former partially implemented, latter not implemented yet - hand-edit) -

   .. code:: console

      shell/setup/compile ccs-pa

Then copy the relevant data files into named volumes for Docker - 

   .. code:: console

      shell/adapter/copy ccs-pa
      shell/agent/copy ccs-pa

Then build the multiarchitecture Docker image - this will also deploy it to our Ladder99 Docker Hub. 

   .. code:: console

      shell/adapter/build

Then start all the services with (where ``ccs-pa`` is the name of the setups folder, others correspond to docker-compose yamls in ``setups/ccs-pa/docker``) -

   .. code:: console

      shell/setups/start ccs-pa base sims db app

You can stop services with

   .. code:: console

      shell/setups/stop ccs-pa sims

To replay some more mqtt messages (not yet working),

   .. code:: console

      shell/setup/replay ccs-pa
