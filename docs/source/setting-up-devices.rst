*******************
Setting Up Devices
*******************

A configuration of devices is called a 'setup', and is defined in the ``setups`` folder. 


Example setup
===================

Ladder99 comes with a print & apply machine as an example, defined in ``setups/ccs-pa`` - let's try that out -

Start all the services with

   .. code:: console
   
      shell/docker ccs-pa start

Now you can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via SHDR messages. 

To see the data the agent generates visit http://raspberrypi.local:5000/current (where the address is your edge device)

   .. image:: _images/agent.jpg


Setup/view the Grafana dashboard at http://raspberrypi.local:3003. The default username/password is admin/admin.


Next we'll look at how to develop custom adapters for other devices.
