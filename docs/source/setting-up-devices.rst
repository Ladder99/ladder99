*******************
Setting Up Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder.

#. Copy data files into named volumes for Docker

   ``ccs-pa`` in this case refers to the subdirectory in ``setups``, which contains the data files.

   .. code:: console

      shell/adapter/copy ccs-pa
      shell/agent/copy ccs-pa

   .. note::

      You can see all the available shell commands with ``tree shell``.

#. Start all the services

   ``ccs-pa`` here is the name of the setups subfolder, and others are names of yaml files in the ``setups/ccs-pa/docker`` folder.

   .. code:: console
   
      shell/setups/docker start ccs-pa base sims db

   Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

   To see the data the agent generates visit (where the address is your edge device)

      raspberrypi.local:5000/current
      
   .. image:: _images/agent.jpg

.. #. Setup the database with

..    .. code:: console
      
..       shell/db/run setups/ccs-pa/migrations/000-init.sql
..       shell/db/run setups/ccs-pa/migrations/001-tables.sql
..       etc

#. Start the MTConnect application, which transfers data from the agent to the database

   .. code:: console

      shell/setups/docker start ccs-pa app

#. Replay some more mqtt messages (not yet working),

   .. code:: console

      shell/setup/replay ccs-pa

#. Setup/view the Grafana dashboard at raspberrypi.local:3003

   The default username/password is admin/admin.

Next we'll look at how to develop custom adapters for other devices.
