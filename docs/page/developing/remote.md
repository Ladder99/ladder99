# Introduction

## Start Remote Services

Remote computer will be used to host Postgres and Grafana instances.

On a remote computer, install Ladder99:

```
cd ~
git clone https://github.com/Ladder99/ladder99
cd ladder99
git checkout v0.10.1
shell/install/cli
source ~/.bashrc
```

Create and use a 'dev' configuration setup:

```
l99 init dev
```

Edit the docker-compose.yaml file - 

```
nano setups/dev/services/docker-compose.yaml

---

agent:
    # use the latest MTConnect Agent ARM image
    image: ladder99/agent:2.0.0.12_RC23-arm
...

postgres:
    # allow remote access to db
    ports:
      - $PGPORT:5432/tcp
```

Modify base compose file to prevent Postgres port conflicts:

```
nano services/docker-compose.yaml

#ports:
    #- 127.0.0.1:$PGPORT:5432/tcp # this way, only localhost can access the port
```

Selectively start the stack, omitting `adapter` and `relay`.

```
l99 start agent dozzle grafana pgadmin portainer postgres
```

Here you get a chance to change environment variables such as credentials to db and viz.
Either `nano setups/dev/.env` or just start again to accept defaults.

```
l99 start agent dozzle grafana pgadmin portainer postgres
```

`l99 status` will display the status of the stack.

```
project    service     STATUS          PORTS
ladder99   agent       Up 24 seconds   0.0.0.0:5000->5000/tcp, :::5000->5000/tcp
ladder99   dozzle      Up 24 seconds   0.0.0.0:8080->8080/tcp, :::8080->8080/tcp
ladder99   grafana     Up 23 seconds   0.0.0.0:80->3000/tcp, :::80->3000/tcp
ladder99   pgadmin     Up 24 seconds   0.0.0.0:5050->5050/tcp, :::5050->5050/tcp
ladder99   portainer   Up 23 seconds   8000/tcp, 9443/tcp, 0.0.0.0:9000->9000/tcp, :::9000->9000/tcp
ladder99   postgres    Up 23 seconds   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp
```

For now all we care is that `postgres` is accessible from a remote computer.


## Start Local Development

On your development machine, clone `https://github.com/Ladder99/ladder99` and open in your IDE.

The setup file used will be `setups/example/setup.yaml`.  It is configured to query two Agents: `http://agent:5000` which is innacessible; and `http://mtconnect.mazakcorp.com:5701` which should be accessible from your development machine.

Set your working directory to the absolute path of `services/relay`:

```
cd ~/ladder99/services/relay
```

Install NodeJS dependencies:

```
npm install
```

Set your environment variables, with PGHOST pointing to the remote computer:

```
FETCH_COUNT=800
FETCH_INTERVAL=2000
L99_SETUP_FOLDER=../../setups/example
PGDATABASE=postgres
PGHOST=10.1.10.135
PGPASSWORD=postgres
PGPORT=5432
PGUSER=postgres
```

Run `src/index.js`.

```
node src/index.js
```

The remote database will begin populating with data from Mazak's Agent.

```
SELECT * FROM public.devices
SELECT * FROM public.dataitems
SELECT * FROM public.history_all
```
