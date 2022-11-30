# Installation
</br>
</br>

## Assumptions

Debian/Ubuntu Linux

ARM based processor

</br>
</br>

## Step 1: Install Docker & Docker Compose

**Docker** lets us run the different parts of the pipeline in a consistent way on different platforms.

First check if it's on your system 

```bash
docker version
```

If not there, install it - https://docs.docker.com/get-docker/.


## Docker Compose

**Docker Compose** allows us to run several Docker services at once. Docker Desktop now comes with Docker Compose, so you may already have it on your system - check with

```bash
docker compose version
```

If not there, install it as shown here - https://docs.docker.com/compose/install/.


## Step 2: Create User

If you don't already have a user created on the system do so now. We suggest naming the user after your company/customer

```bash
sudo adduser <your-company-name>
```

Logout and login to the new user for the Ladder99 install.


## Step 3: Install Ladder99

Now go to a good working directory and install the Ladder99 pipeline source code by cloning the code from GitHub and running the install script

```bash
cd ~
git clone https://github.com/Ladder99/ladder99
cd ladder99
shell/install/cli
```

This should show output like so 

```plain
Adding PATH extension and L99 variables to ~/.bashrc...
Using 'example' for Ladder99 setup, as found in the 'setups' folder.
Done.
Please run the file by typing in 'source ~/.bashrc', or logout and log back in.
Then try 'l99'.
```


## Step 7: Finish the Installation

Now load the Ladder99 environment variables into your shell,

```bash
source ~/.bashrc
```

and that's it - the next page shows how to run Ladder99. 

