# Ladder99 Setup Template

This is a template for Ladder99 setups. 

## Setup OS

Install friendlycore Linux on a microSD card. Start it up and login with SSH -

    ssh pi@[local ip address]
    [initial password is pi]

change password quickly with `passwd`.

## Install Ladder99

Clone the ladder99 repo -

    git clone https://github.com/Ladder99/ladder99
    cd ladder99

If you want the latest bleeding-edge version of the pipeline, can say -

    git checkout develop

## Install Docker Compose

Install docker-compose with

    shell/install/compose-friendlycore

## Install Setup

Clone the setup repo in an adjacent folder - e.g. for the OxBox setup,

    cd ..
    git clone https://github.com/Ladder99/setup-oxbox

You will need a GitHub personal access token (PAT) for the setup repo, as it's private, and GitHub has moved away from passwords. Just login with your username and copy/paste your PAT with mouse middle-click or Cmd-V or Shift-Insert, depending on the terminal you're using.

## Test Pipeline

Run the following to test the pipeline

    cd ladder99
    ./start oxbox

The first time running it you'll be asked to edit an `.env` file to set a password. Then run the command again. It may take a while to build and start the first time it's run (eg 10+ mins).

Then you can visit http://localhost:5000 for the MTConnect Agent UI, and http://localhost for the Grafana dashboard. 

For the first time visiting Grafana use username 'admin', password 'admin', then you will be prompted to change the password. 

You can see and manage the Docker containers at http://localhost:9000, with similar name/pw.

## Deploy

Put the SD card with the pipeline into the microcontroller at the client site.

## Login

SSH into the microcontroller at the site,

    ssh pi@[client ip address]
    [password]

## Update Pipeline and Client Setup

Get the latest code from the GitHub repo -

    cd ladder99
    git pull
    (cd ../setup-oxbox && git pull)

The last cmd may need your GitHub login info.

## Start the Pipeline

Run this to start the pipeline the first time

    ./start oxbox

## Restart the Pipeline

Goto Portainer at [client ip address]:9000 - it should all be green/running. If any are red/stopped, something went wrong - check the error logs for the stopped services.

To restart the pipeline with any changes, select the services changed minus portainer, click STOP (adapter and agent might take 10secs to stop), then select them all again and click START (clicking restart just runs them with the same parameters).

Alternatively, you can stop the entire pipeline and restart it with the following -

    ./stop oxbox
    ./start oxbox
