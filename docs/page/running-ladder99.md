# Running Ladder99

Ladder99 comes with an example that displays data from a **live** CNC machine. 


## Run Pipeline

Run the example setup with

```
./l99 start example
```

The first time you run this it will download and build all the different services. This WILL take several minutes, so grab a coffee!




## View Dashboard

Now you can go to the dashboard at http://localhost/d/main. 

The first time you visit Grafana, it will ask you for the username and password - this is just 'admin' and 'admin'. Then you will need to enter a new password. 

Grafana will then show the live status of a Mazak CNC machine. 

![](_images/grafana-demo.png)

Try clicking on the different pages linked at the top - 'DataItems', 'Devices', 'Main', 'Microcontroller'.

The 'Microcontroller' page will show your computer's memory, CPU usage, and temperature (if your processor supports it) over time. 

![](_images/ladder99-dash-micro.jpg)


## List Services

To see the list of running services and their status,

```
./l99 list
```

e.g.

```
$ ./l99 list
NAMES      STATUS        PORTS
adapter    Up 16 hours
agent      Up 12 hours   0.0.0.0:5000->5000/tcp
dozzle     Up 16 hours   0.0.0.0:8080->8080/tcp
grafana    Up 16 hours   0.0.0.0:80->3000/tcp
pgadmin    Up 16 hours   0.0.0.0:5050->5050/tcp
postgres   Up 16 hours   0.0.0.0:5432->5432/tcp
relay      Up 16 hours
```

The url and port listed on the left is what you would enter in the browser to access that service - e.g. for Dozzle it's http://localhost:8080.


## Stop Pipeline

When you're done, you can stop all the Ladder99 services with

```
./l99 stop all
```
