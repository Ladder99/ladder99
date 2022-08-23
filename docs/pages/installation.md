# Installation

Open a terminal window (if on Windows, use Git Bash), and go to a good working directory - the Desktop or your home directory will do. 

> Note: It's not recommended to use a cloud folder like Dropbox, as this would slow down the installation.

## Install Docker

Ladder99 uses **Docker** to run services on different platforms.

First check if it's on your system -

```
docker version
```

If not there, install it - https://docs.docker.com/get-docker/.

## Install Docker Compose

Ladder99 uses **Docker Compose** to orchestrate the different services - check if you have it with

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

Then check out the latest branch with -

```
git checkout historian
```
