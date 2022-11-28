# Installation

## Install Git

**Git** gives us access to the source code for Ladder99, and also provides a console on Windows that acts more like a Linux console, **Git Bash**. 

You can install it from https://git-scm.com/downloads.

Open a terminal window -

If on Windows, run **Git Bash** to get a more Linux-like environment -

![](../_images/git-bash.jpg)


## Install Docker

**Docker** lets us run the different parts of the pipeline in a consistent way on different platforms.

First check if it's on your system -

```bash
docker version
```

If not there, install it - https://docs.docker.com/get-docker/.


## Install Docker Compose

Ladder99 uses **Docker Compose** to orchestrate the different services - check if you have it with

```bash
docker-compose version
```

Install or upgrade it at https://docs.docker.com/compose/install/.


## Install Ladder99

First, go to a good working directory and install the Ladder99 pipeline source code by cloning the code from GitHub and running the install script -

```bash
cd ~
git clone https://github.com/Ladder99/ladder99
cd ladder99
shell/install
```

e.g.

```
$ shell/install
Adding PATH extension and L99 variables to ~/.bashrc...
Using 'example' for Ladder99 setup.
Done.
Please run the file by typing in 'source ~/.bashrc', or logout and log back in.
Then try 'l99'.
```


## Finish the Installation

This will load the Ladder99 environment variables into your shell -

```bash
source ~/.bashrc
```


## Run the Ladder99 CLI

The Ladder99 console interface is a script named 'l99' (that's a small 'L' not the number '1'). You can run it to see a list of available commands, and the setup you are currently using -

```
$ l99

Usage: l99 COMMAND [PARAMS]

Run a Ladder99 command.

COMMAND
    disk      show disk usage for a setup
    init      create a new setup folder
    list      list running services
    logs      follow and search logs of a running or stopped service
    restart   restart services
    start     start services
    stop      stop running services
    update    update source code for ladder99 and a given setup
    use       specify setup to use with l99 commands

Run the command or with -h for help on that command.

Examples
    l99 list
    l99 use example
    l99 disk
    l99 start agent
    l99 logs agent error
    l99 stop agent
    l99 update
    l99 init my-company

Current Ladder99 setup is 'example', as found in the 'setups' folder. 
```
