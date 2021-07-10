# Setting Up Devices

A configuration of devices is called a 'setup', and is defined in the `setups` folder.

# Example setup

Ladder99 comes with a print & apply machine as an example, defined in `setups/ccs-pa` - let's try that out.

First, make sure you've set the environment variables as on the previous page -

    cp setups/.env-default setups/.env
    nano setups/.env

Then start all services with

    sh/pipeline start ccs-pa

Now you can watch the pipeline send MQTT messages to the brokers through to the adapter and then onto the agent via SHDR messages.

Note: The messages come from recordings made of P&A machines, and are stored in csv files in `models/ccs-pa/simulations`.

To see the data the agent generates visit http://raspberrypi.local:5000/current (where the address is your edge device)

![img](_images/agent.jpg)

Setup/view the Grafana dashboard at http://raspberrypi.local:3003. The default username/password is admin/admin.

![img](_images/grafana-pa.jpg)

Next we'll look at how to develop custom adapters for other devices.
