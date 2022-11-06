# Create Setup

Now let's create a new setup so we can hook it up to another machine - which could be one of your own, if you have an MTConnect-compatible device. 


## Copy Example

This will copy the example setup we saw earlier - you can use your company name here, with NO spaces -

    ./l99 init <your-company-name>
     
Then start the pipeline with

    ./l99 start <your-company-name>


## Edit Passwords

Ladder99 will first ask you to edit a `.env` file, mainly to set the initial passwords -

    nano ../setup-<your-company-name>/.env

Edit the Grafana and Postgres passwords if desired, save the file, and run again -

    ./l99 start <your-company-name>


## Add Agent / Machine

To add another Agent to the setup, add the following to `../setup-<your-company-name>.yaml` (the indentation is important!) -

```yaml
    - alias: <your-company-name> # don't change once set!
      url: <your-agent-ip-address> # eg 10.1.122.1
```

Then restart the relevant portions of the pipeline - 

    ./l99 start <your-company-name> relay

Now you should see machines from your new agent showing up in the dashboard. You may need to refresh the browser window by hitting F5 first. 

