# Installation

<!-- ## Ladder99

**Ladder99** is a pipeline that includes **Adapters** that feed data from various devices to the MTConnect **Agent**, and a **Relay** that reads the Agent output and passes it on to a Database - a Dashboard then displays the current and past values. -->

## Install Docker Compose

Ladder99 uses **Docker Compose** to run the different services - check if you have it with

```
docker-compose version
```

Install or upgrade it at https://docs.docker.com/compose/install/.

## Install Ladder99

Next, install the Ladder99 pipeline by cloning the code from GitHub. If you don't have **git**, you can install it from https://git-scm.com/downloads -

```
git clone https://github.com/Ladder99/ladder99
cd ladder99
```

The current branch is 'historian' - check it out with -

```
git checkout historian
```

## Run Ladder99

To test the pipeline, open a terminal window (if on Windows, use Git Bash), and run it with 

```
./l99 start example
```

The first time you run this for a setup, it will ask you to edit a .env file, mainly to set the database password. This is optional - it will default to 'postgres'.

```
$ ./l99 start example
No .env file found - copying from default...
PLEASE EDIT setups/example/.env, e.g. nano setups/example/.env
```

Now run `./l99 start example` again, and it should download, build, and start the different services. This may take several minutes the first time you run it. 

Once it's done, you can view the dashboard at http://localhost/d/main. The first time you visit Grafana, it will ask you for the admin password - this is just 'admin'. Then you will need to enter a new password. Grafana will then show the live status of a remote Mazak CNC machine. 

Click on the 'microcontroller' link at the top-right of the page to see your computer's memory, cpu usage, and temperature (if your processor supports it) over time. 

![](_images/ladder99-dash-micro.jpg)

To stop all the services, say

```
./l99 stop all
```
