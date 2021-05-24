*******************
Getting Started
*******************

Running the Agent
=====================

Let's run the MTConnect Agent, which comes with a simulator for a CNC device.

On your edge device, in the ladder99 folder (note the d in startd, for detach, to run in the background) -

   .. code:: console

      shell/setups/docker startd vmc base

Now you should be able to view the MTConnect Agent output on your browser at e.g. http://raspberrypi.local:5000.

.. image:: _images/agent.jpg


Setting up the database
=========================

First, make a copy of the default settings file and edit it as needed -

   .. code:: console

      cp setups/vmc/.env-default setups/vmc/.env
      nano setups/vmc/.env

Start the database on the edge device - the first time this is run it may take a minute -

   .. code:: console

      shell/setups/docker startd vmc db

Initialize the database - 

   .. code:: console

      shell/db/migrate vmc 000-init.sql
      shell/db/migrate vmc 001-tables.sql


Starting the Application
=========================

Now start the application, which feeds data from the agent to the database and visualizer -

   .. code:: console

      shell/setups/docker start vmc app


Viewing the dashboard
=========================

Now you should be able to view a dashboard in your browser at http://raspberrypi.local:3003. The default username/password is admin/admin - you'll be asked to change the password. 

.. image:: _images/grafana.jpg


Next we'll take a look at setting up some devices.
