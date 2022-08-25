# Create Setup

Now let's create a new setup so we can hook it up to another Agent - which could be one of your own, if you have an MTConnect-compatible machine. 


## Copy Example

This will copy the example setup we saw earlier into the folder `../setup-test` -

    ./l99 init test
     
Then start the pipeline with

    ./l99 start test


## Edit Passwords

Ladder99 will first ask you to edit a .env file, mainly to set the initial passwords -

    nano ../setup-test/.env

Edit the Grafana and Postgres passwords, and run 

    ./l99 start test

again.


## Add Agent

To add another agent to the setup, add the following to `../setup-test/setup.yaml` -

```yaml
    - alias: NIST # or your own agent name # don't change once set!
      url: https://smstestbed.nist.gov/vds # or your own agent url
```

Then restart the relevant portions of the pipeline - 

    ./l99 start relay

Now you should see machines from your new agent showing up in the dashboard. You may need to refresh the browser window with F5 first. 

