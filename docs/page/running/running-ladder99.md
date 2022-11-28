# Running Ladder99


## Run the Ladder99 CLI

The Ladder99 console interface is a script named 'l99' (with a small 'L' not the number '1'). 

You can run it to see a list of available commands, and the setup you are currently using -

```plain
$ l99
Usage: l99 COMMAND [PARAMS]

Run a Ladder99 command.

COMMAND
    build     build a Docker image for a ladder99 service
    disk      show disk usage for current setup
    download  clone a git repo to use as current setup
    init      create a new setup folder
    logs      follow and search logs of a running or stopped service
    restart   restart services
    start     start services
    status    show status of running services
    stop      stop running services
    update    update source code for ladder99 and current setup
    use       specify setup to use with l99 commands

Run the command with -h for help on that command.

Examples
    l99 status
    l99 use example
    l99 disk
    l99 start agent
    l99 logs agent error
    l99 stop agent
    l99 update
    l99 init my-company

Using 'example' for Ladder99 setup, as found in the 'setups' folder.
```


## Run Example

Ladder99 consists of a set of services that run according to the directions in a 'setup' folder. 

Ladder99 comes with an example setup that displays data from a **LIVE** Mazak CNC machine. 

From your `ladder99` folder, run the base services with

```bash
l99 start
```

You'll see output like the following when the services are started - 

```plain
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

