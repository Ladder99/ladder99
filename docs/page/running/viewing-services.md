# Viewing Services

## Check Status

First let's make sure all the services are running alright - 

```bash
$ l99 status
project    service     STATUS          PORTS
ladder99   adapter     Up 25 seconds
ladder99   agent       Up 25 seconds   0.0.0.0:5000->5000/tcp
ladder99   dozzle      Up 24 seconds   0.0.0.0:8080->8080/tcp
ladder99   grafana     Up 23 seconds   0.0.0.0:80->3000/tcp
ladder99   pgadmin     Up 22 seconds   0.0.0.0:5050->5050/tcp
ladder99   portainer   Up 23 seconds   8000/tcp, 9443/tcp, 0.0.0.0:9000->9000/tcp
ladder99   postgres    Up 22 seconds   127.0.0.1:5432->5432/tcp
ladder99   relay       Up 25 seconds
```

Everything looks good! 

If you see any services are marked as 'stopped' or 'restarting', please see the [Troubleshooting](../reference/troubleshooting.md) page.

