*******************
Getting Started
*******************

Running the Agent
=====================

Let's run the MTConnect Agent, which comes with a simulator for a CNC device.

On your edge device, in the ladder99 folder -

   .. code:: console

      shell/setups/docker start vmc base

Now you should be able to view the MTConnect Agent output on your browser at e.g. http://raspberrypi.local:5000.

.. image:: _images/agent.jpg


Viewing the dashboard
=========================

Start the database in another console on the edge device. The first time this is run it will setup the database, which takes a minute -

   .. code:: console

      shell/setups/docker start vmc db

Initialize the database - 

   .. code:: console

      shell/db/migrate vmc 000-init.sql

Now start the application, which feeds data from the agent to the database and visualizer -

   .. code:: console

      shell/setups/docker start vmc app

Now you should be able to view a dashboard in your browser at http://raspberrypi.local:3003.

.. image:: _images/grafana.jpg


Next we'll take a look at setting up some devices.
