# Running Ladder99

Ladder99 consists of a set of services that run according to the directions in a 'setup' folder. 


## Run Example

Ladder99 comes with an example setup that displays data from a **LIVE** Mazak CNC machine. 

From your `ladder99` folder, run the base services with

```bash
l99 start
```

You'll see output like the following when the services are started - 

```
Recreating adapter   ... done
Recreating agent     ... done
Recreating grafana   ... done
Recreating pgadmin   ... done
Recreating portainer ... done
Recreating postgres  ... done
Recreating relay     ... done

Run 'l99 status' to check status of services.
```

If you have any trouble, check the [Troubleshooting](../reference/troubleshooting.md) page.

Next let's look at the dashboard.
