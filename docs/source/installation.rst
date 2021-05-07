**************
Installation
**************

Requirements
-----------------------

- An edge device running Linux (e.g. a Raspberry Pi)


Steps
-----------------------

#. SSH into the edge device using its IP address and your username and password, e.g.

   .. code:: console

      ssh pi@192.168.0.109
      (password)

#. Clone this repo there

   .. code:: console

      git clone https://github.com/Ladder99/ladder99
      cd ladder99

#. Set environment variables

   Copy the ``.env-example`` file to ``.env`` and modify the passwords as needed, then load the environment variables

   .. code:: console

      cp .env-example .env
      nano .env   
      source .env

#. Install dependencies

   Install Docker_, Node_, Python_, jq_, and other dependencies

   .. note::

      You can see the available shell commands with ``tree sh``.

   .. code:: console

      sh/install/linux
      sh/install/docker
      sh/install/node

#. Copy data files into named volumes for Docker

   ``pi`` in this case refers to the subdirectory in ``setups``, which contains the data files.

   .. code:: console

      sh/adapter/copy pi
      sh/agent/copy pi


#. Start all the services

   ``pi`` is the name of the setups folder, and others are names of yaml files in the setups/pi/docker folder.

   .. code:: console
   
      sh/setups/start pi base sims db app

   Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

   To see the data the agent generates visit (where the IP address is your edge device)

      192.168.0.109:5000/current 
      
   .. image:: _images/agent.jpg


#. Setup the database with

   .. code:: console
      
      setups/pi/shell/dbrun setups/pi/migrations/000-init.sql
      setups/pi/shell/dbrun setups/pi/migrations/001-tables.sql
      etc



.. _Docker: https://www.docker.com/
.. _Node: https://nodejs.org/en/
.. _Python: https://www.python.org/
.. _jq: https://stedolan.github.io/jq/
