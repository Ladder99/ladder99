*******************
Setting Up Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder. Ladder99 comes with a print & apply machine as an example, defined in setups/ccs-pa - let's try that out -

#. Start all the services

   .. code:: console
   
      shell/docker ccs-pa start

   Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via SHDR messages. 

   To see the data the agent generates visit (where the address is your edge device)

      http://raspberrypi.local:5000/current
      
   .. image:: _images/agent.jpg

.. #. Start the MTConnect application, which transfers data from the agent to the database

..    .. code:: console

..       shell/setups/docker start ccs-pa app

.. #. Replay some more mqtt messages (not yet working),

..    .. code:: console

..       shell/setup/replay ccs-pa

#. Setup/view the Grafana dashboard at http://raspberrypi.local:3003. The default username/password is admin/admin.


Next we'll look at how to develop custom adapters for other devices.
