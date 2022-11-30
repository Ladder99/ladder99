# Create Setup

Now let's create a new setup so we can hook it up to another machine - which could be one of your own, if you have an MTConnect-compatible device. If you have not already make sure all L99 services have been stopped before continuing with
```bash
l99 stop all
```


## Clone Example Setup

Clone the example setup with this command - you can use your company name here, for example, with NO spaces -

    l99 init <your-company-name>

This will create a directory at `setups/<your-company-name>` for the configuration and data for your setup - e.g.

```plain
$ l99 init my-company

Copying from 'setups/example'...
Using 'my-company' for Ladder99 setup.
Done. Try 'l99 start'.
```


## Add Agent / Machine

Now add an MTConnect Agent to the setup - edit the `setup.yaml` file -

```bash
nano setups/<your-company-name>/setup.yaml
```

Scroll down to the 'relay:agents:' section where it says

```yaml
    - alias: Mazak5701 # this is an identifier for the agent, used by the db - don't change once set!
      url: http://mtconnect.mazakcorp.com:5701 # url to the agent
      retention: 1week # agent retention - overrides relay retention value
      # ignore: true # ignore this agent - overrides relay ignore value
      # the devices sections is optional, but lets you assign a friendly alias and retention period, etc.
      devices:
        - id: d1 # must match id in agent.xml
          alias: Mill-12345 # used in path expressions - no spaces!
```

Replace this with your agent info and comment out the devices listed - i.e.

```yaml
    - alias: <your-company-name> # don't change once set!
      url: <your-agent-ip-address> # eg 10.1.122.1

      #devices:
      #  - id: d1 # must match id in agent.xml
      #    alias: Mill-12345 # used in path expressions - no spaces!
```


## Start Pipeline / Edit Passwords

Then you can start the pipeline with

    l99 start

Ladder99 will first ask you to edit a `.env` file to set the initial passwords. You can skip this command and start again to use default passwords -

    nano setups/<your-company-name>/.env

Edit the Grafana and Postgres passwords, save the file, and run again -

    l99 start
    

## Check Dashboard

It may take half a minute or so for things to get started. Then visit the Grafana dashboard at http://localhost and login with username 'admin' and your password. You should see machines from your agent showing up. 
