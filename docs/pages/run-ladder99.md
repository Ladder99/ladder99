# Run Ladder99

Ladder99 comes with an example setup that pulls data from a live Mazak CNC machine, and the local/host computer. 

## Build Services

To test the pipeline, run the example setup with 

```
./l99 start example
```

The first time you run this it will download and build all the different services. This WILL take several minutes, so grab a coffee!

## Run Pipeline

When you first run `./l99 start` for a setup it will ask you to edit a .env file, mainly to set the database password. This is optional - the password will default to 'postgres'.

```
$ ./l99 start example
No .env file found - copying from default...
PLEASE SET INITIAL PASSWORDS IN .env FILE - e.g.
$ nano setups/example/.env
Then re-run the start command. 
```

Now run `./l99 start example` again. 

## View Dashboard

Now go to the dashboard at http://localhost/d/main. 

The first time you visit Grafana, it will ask you for the username and password - this is just 'admin' and 'admin'. Then you will need to enter a new password. 

Grafana will then show the live status of a remote Mazak CNC machine. 

[img]

Try clicking on the different pages linked at the top - 'Dataitems', 'Main', 'Micro', 'Paths'.

The 'Micro' page will show your computer's memory, CPU usage, and temperature (if your processor supports it) over time. 

![](_images/ladder99-dash-micro.jpg)

## Stop Pipeline

To stop all the Ladder99 services, say

```
./l99 stop all
```
