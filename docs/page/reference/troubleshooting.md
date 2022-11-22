# Troubleshooting

## Check Status

You can check the status of the Ladder99 services with `l99 list`, e.g. -

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

## Stop Service

If any of these say 'restarting', you can stop the service with e.g. 

```bash
l99 stop adapter
```

## Check Output

You can check the output of a service with the `l99 logs` command - e.g. 

```bash
$ l99 logs adapter
2022-09-17T01:04:04.252494579Z
2022-09-17T01:04:04.252710485Z Ladder99 Adapter
2022-09-17T01:04:04.252756783Z Polls/subscribes to data, writes to cache, transforms to SHDR,
2022-09-17T01:04:04.252767546Z posts to Agent via TCP.
2022-09-17T01:04:04.252816475Z 2022-09-17T01:04:04.252Z
2022-09-17T01:04:04.252820531Z ----------------------------------------------------------------
2022-09-17T01:04:04.252949896Z Reading /data/setup/setup.yaml...
2022-09-17T01:04:04.269921704Z Adapter setup shared input { driver: 'mqtt-provider', url: 'mqtt://mosquitto:1883' }
2022-09-17T01:04:04.269947407Z Adapter importing driver code: ./drivers/mqtt-provider.js...
2022-09-17T01:04:04.336690853Z MQTT-provider init mqtt://mosquitto:1883
2022-09-17T01:04:04.336763934Z MQTT-provider connecting to url mqtt://mosquitto:1883
```

This will 'follow' the output and print the service's output as it runs - to exit hit Ctrl+C. 


## Search Output

You can also search the output for text like 'error' with 

```bash
l99 logs adapter error
```
