# Running Ladder99

Ladder99 comes with an example setup that displays data from a **LIVE** Mazak CNC machine. 


## Run Pipeline

Run the example setup with

```bash
cd ladder99
./l99 start example  # or just 'l99 start example' on Windows
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

Ladder99 is made up of a set of services - this shows the status of each of them. If you have any trouble, check the [Troubleshooting](troubleshooting.md) page.

Next let's look at the dashboard!
