*******************
Setting Up Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder.

.. #. Activate the Python virtual environment

..    (currently just used with the replay cmd, which doesn't work yet)

..    .. code:: console

..       source ~/.venv/ladder99-venv/bin/activate

#. Set environment variables

   Copy the ``.env-example`` file to ``.env`` and modify the passwords as needed, then load the environment variables

   .. code:: console

      cp .env-example .env
      nano .env   
      source .env

#. Copy data files into named volumes for Docker

   ``pi`` in this case refers to the subdirectory in ``setups``, which contains the data files.

   .. code:: console

      shell/adapter/copy pi
      shell/agent/copy pi

   .. note::

      You can see all the available shell commands with ``tree shell``.

#. Start all the services

   ``pi`` here is the name of the setups folder, and others are names of yaml files in the setups/pi/docker folder.

   .. code:: console
   
      shell/setups/start pi base sims db

   Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

   To see the data the agent generates visit (where the address is your edge device)

      raspberrypi.local:5000/current
      
   .. image:: _images/agent.jpg

#. Setup the database with

   .. code:: console
      
      shell/db/run setups/pi/migrations/000-init.sql
      shell/db/run setups/pi/migrations/001-tables.sql
      etc

#. Start the MTConnect application

   .. code:: console

      shell/setups/start pi app

#. Setup/view the Grafana dashboard at raspberrypi.local:3003

   The default username/password is admin/admin.

   