# Remote Setup

## Start Remote Services

Log into the computer where you want to install Ladder99 and follow the following instructions. This computer will run Postgres and Grafana.

1. Clone the Ladder99 repository.

```bash
repo_root="$HOME/ladder99"
commit='v0.11.7'  # Branch, commit or tag to check out; use tags for specific releases 
git clone https://github.com/Ladder99/ladder99 "$repo_root"
```

2. Install Ladder99.

```bash
"$repo_root/shell/install/cli"
source ~/.bashrc
```

3. Create and use a Ladder99 configuration setup. This copies `setups/example` configuration to `setups/$configuration_name`. 

```bash
configuration_name='dev'
l99 init "$configuration_name"
```

4. Edit `setups/$configuration_name/services/docker-compose.yaml` file to provide overrides per your requirements. In order to access the database outside of `localhost`, you need to add `ports` to 

```bash
postgres:
  # allow remote access to db
  ports:
    - $PGPORT:5432/tcp
```

You also need to comment out the `ports` in the base compose file (`services/docker-compose.yaml`) to prevent Postgres port conflicts:

```bash
# ports:
    # - 127.0.0.1:$PGPORT:5432/tcp # this way, only localhost can access the port
```

5. Selectively start the stack, omitting `adapter` and `relay`.

```bash
l99 start agent dozzle grafana pgadmin portainer postgres
```

6. It is strongly suggested you change the environment variables such as credentials to database and Grafana in `setups/$configuration_name/.env`. For testing purposes you can also accept the defaults.

7. Start the services again.

```bash
l99 start agent dozzle grafana pgadmin portainer postgres
```

8. `l99 status` will display the status of the stack.

```bash
project    service     STATUS          PORTS
ladder99   agent       Up 24 seconds   0.0.0.0:5000->5000/tcp, :::5000->5000/tcp
ladder99   dozzle      Up 24 seconds   0.0.0.0:8080->8080/tcp, :::8080->8080/tcp
ladder99   grafana     Up 23 seconds   0.0.0.0:80->3000/tcp, :::80->3000/tcp
ladder99   pgadmin     Up 24 seconds   0.0.0.0:5050->5050/tcp, :::5050->5050/tcp
ladder99   portainer   Up 23 seconds   8000/tcp, 9443/tcp, 0.0.0.0:9000->9000/tcp, :::9000->9000/tcp
ladder99   postgres    Up 23 seconds   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp
```

## Start Local Development

On your development machine, clone `https://github.com/Ladder99/ladder99` and open in your IDE.

The setup file used will be `setups/example/setup.yaml`. It is configured to query two Agents: `http://agent:5000` which is innacessible; and `http://mtconnect.mazakcorp.com:5701` which should be accessible from your development machine.

Install the NodeJS dependencies:

```bash
cd "$repo_root/services/relay" && npm i
```

Set your environment variables, with `PGHOST` pointing to the remote computer:

```ini
FETCH_COUNT=800
FETCH_INTERVAL=2000
L99_SETUP_FOLDER=../../setups/example
PGDATABASE=postgres
PGHOST=10.1.10.135
PGPASSWORD=postgres
PGPORT=5432
PGUSER=postgres
```

Run `$repo_root/services/relay/src/index.js`.

```bash
node "$repo_root/services/relay/src/index.js"
```

The remote database will begin populating with data from Mazak’s Agent. You can check it using the following queries.

```sql
SELECT * FROM public.devices
SELECT * FROM public.dataitems
SELECT * FROM public.history_all
```
