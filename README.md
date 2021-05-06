# Ladder99

Ladder99 transfers data from factory devices to a database and end-user visualizations using MTConnect, an open standard. 

MTConnect standardizes factory device data flow and vocabulary - it was designed by UC Berkeley, Georgia Institute of Technology, and Sun Microsystems in 2008. 

See our documentation on readthedocs.org here - https://ladder99.readthedocs.io/en/latest/.


## Developing

The device models are defined in `models`, eg the ccs-pa model has model.yaml, inputs.yaml, outputs.yaml, and types.yaml. 

The device instances are defined in the `setups` folder, eg the `demo` setup has a list of instances in the devices subfolder there. Edit these as needed.

Then generate the `setups/demo/volumes/agent/devices.xml` and `setups/demo/docker/docker-compose.yaml` files (former partially implemented, latter not implemented yet - hand-edit) -

    sh/setup/compile pi

Then copy the relevant data files into named volumes - 

    sh/adapter/copy pi
    sh/agent/copy pi

Then build the multiarchitecture Docker images - this will also push them to our Ladder99 Docker Hub. This can be done on another machine, as it can take a few hours if starting from scratch -

    sh/adapter/build
    sh/agent/build

Then start all the services with (where pi is the name of the setups folder) -

    sh/setups/up pi base sims db app

or to run some services on the pi, some elsewhere, etc -

    sh/setups/up pi base sims
    sh/setups/up pi db
    sh/setups/up pi app

Setup the database with

    setups/pi/shell/dbrun setups/pi/migrations/000-init.sql
    setups/pi/shell/dbrun setups/pi/migrations/001-tables.sql
    etc


You can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

You can stop services with

    sh/setups/down pi sims

To see the xml the agent generates visit

    localhost:5000/current

If you're running the setup on a pi, goto something like this -

    192.168.0.109:5000/current 

To replay some more mqtt messages,

    sh/setup/replay pi

(not yet working)


## Documentation

Serve the docs for development with

    sh/docs/serve

Build and deploy the docs with

    sh/docs/build
    sh/docs/deploy

then visit https://ladder99.web.app/
