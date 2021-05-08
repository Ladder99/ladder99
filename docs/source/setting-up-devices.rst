*******************
Setting Up Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder.

#. Activate the Python virtual environment

   .. code:: console

      source ~/.venv/ladder99-venv/bin/activate


#. Set environment variables

   Copy the ``.env-example`` file to ``.env`` and modify the passwords as needed, then load the environment variables

   .. code:: console

      cp .env-example .env
      nano .env   
      source .env

#. Copy data files into named volumes for Docker

   ``pi`` in this case refers to the subdirectory in ``setups``, which contains the data files.

   .. code:: console

      sh/adapter/copy pi
      sh/agent/copy pi


   .. note::

      You can see all the available shell commands with ``tree sh``.

#. Start all the services

   ``pi`` is the name of the setups folder, and others are names of yaml files in the setups/pi/docker folder.

   .. code:: console
   
      sh/setups/start pi base sims db app

   Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

   To see the data the agent generates visit (where the IP address is your edge device)

      raspberrypi.local:5000/current 
      
   .. image:: _images/agent.jpg


#. Setup the database with

   .. code:: console
      
      setups/pi/shell/dbrun setups/pi/migrations/000-init.sql
      setups/pi/shell/dbrun setups/pi/migrations/001-tables.sql
      etc

...
