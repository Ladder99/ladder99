# Running Ladder99

Ladder99 consists of a set of services that run according to the directions in a 'setup' folder. 


## Run Example

Ladder99 comes with an example setup that displays data from a **LIVE** Mazak CNC machine. From your `ladder99` folder, first select the setup with

```bash
l99 use example
```

then run the base services with

```bash
l99 start base
```

The first time you run this it will download and build all the different services. 

This WILL take several minutes, so grab a coffee!


## Check Status

When the command is finished, you'll see output like the following -

```
Recreating pgadmin   ... done
Recreating portainer ... done
Recreating grafana   ... done
Recreating postgres  ... done
Recreating agent     ... done
Recreating relay     ... done
Recreating adapter   ... done
```

Ladder99 is made up of a set of services - this shows the status of each. If you have any trouble, check the [Troubleshooting](troubleshooting.md) page.

Next let's look at the dashboard.
