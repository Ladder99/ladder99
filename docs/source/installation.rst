**************
Installation
**************

Requirements
-----------------------

- An edge device running Linux (e.g. a Raspberry Pi)


Steps
-----------------------

#. In the edge device, start a terminal window and navigate to the home directory, or other suitable place

   .. code:: console

      cd ~
   
#. Clone this repo there

   .. code:: console

      git clone --depth 1 https://github.com/Ladder99/ladder99
      cd ladder99

#. Set environment variables

   Copy the ``.env-example`` file to ``.env`` and modify the passwords as needed, e.g. 

   .. code:: bash

      # edge device, eg raspberry pi
      export EDGE=192.168.0.109
      export EDGE_USER=pi
      export EDGE_PASSWORD=pw

      # postgres/timescaledb
      export PGHOST=$EDGE
      export PGPORT=5432
      export PGDATABASE=ladder99
      export PGUSER=postgres
      export PGPASSWORD=pw

      # postgres admin console
      export PGADMIN_PASSWORD=pw

      # grafana
      export GRAFANA_PASSWORD=pw

   then load the environment variables with

   .. code:: console
    
      source .env

#. Install dependencies

   Install Docker_, Node_, Python_, jq_, and other dependencies

   .. code:: console

      sh/install/linux
      sh/install/docker
      sh/install/deps

#. Copy data files into named volumes for Docker

   ``pi`` in this case refers to the subdirectory in ``setups``, which contains the data files.

   .. code:: console

      sh/adapter/copy pi
      sh/agent/copy pi


   .. note::

      You can see all the shell commands available with

      .. code:: console

         tree sh

      e.g.

      .. code:: console

         $ tree sh
         sh
         ├── adapter
         │   ├── build
         │   ├── copy
         │   └── test
         ├── agent
         │   ├── build
         │   ├── copy
         │   └── test
         ├── db
         │   ├── cli
         │   └── run
         ├── docker
         │   ├── cp
         │   ├── ls
         │   └── vm
         ├── docs
         │   ├── build
         │   ├── deploy
         │   └── serve
         ├── install
         │   ├── apps
         │   ├── deps
         │   └── docker
         └── setups
            ├── compile
            ├── down
            ├── replay
            └── up
      
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
