# Ladder99 Example Setup

This is an example Ladder99 setup, with live CNC machine connections. 

## Running

Do the following to test the pipeline

    git clone https://github.com/Ladder99/ladder99
    cd ladder99
    git checkout historian
    ./l99 start example

It may take a while to build and start the first time it's run (eg 10+ mins).

## Dashboard

Then you can visit http://localhost for the Grafana dashboard, which shows the microcontroller and CNC machine status. For the first time visiting Grafana use username 'admin', password 'admin', then you will be prompted to change the password. 

## Agent

You can also visit http://localhost:5000/current for the MTConnect Agent UI, which shows the current values for the different dataitems tracked by this setup. 
