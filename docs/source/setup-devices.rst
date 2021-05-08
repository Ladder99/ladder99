*******************
Setup Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder.


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

