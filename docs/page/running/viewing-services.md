# Viewing Services


## List Services

First let's make sure all the services are running alright - 

```bash
$ l99 list
NAMES       STATUS                         PORTS
adapter     Up 34 seconds
agent       Up 32 seconds                  0.0.0.0:5000->5000/tcp
dozzle      Up 5 hours                     0.0.0.0:8080->8080/tcp
grafana     Up 42 seconds                  0.0.0.0:80->3000/tcp
pgadmin     Up 44 seconds                  0.0.0.0:5050->5050/tcp
portainer   Up 43 seconds                  8000/tcp, 9443/tcp, 0.0.0.0:9000->9000/tcp
postgres    Up 42 seconds                  0.0.0.0:5432->5432/tcp
relay       Up 44 seconds
```

Everything looks good! 

If you see any services are marked as 'stopped' or 'restarting', see the [Troubleshooting](troubleshooting.md) section


## Stop Services

When you're done, you can stop all the Ladder99 services with

```bash
l99 stop all
```
