**************
Installation
**************

Requirements
-----------------------

- An edge device running Linux (e.g. a Raspberry Pi)


Steps
-----------------------

#. SSH into the edge device using its local name or IP address and your username and password, e.g.

   .. code:: console

      ssh pi@raspberrypi.local
      (password)

#. Clone this repo there

   .. code:: console

      git clone https://github.com/Ladder99/ladder99
      cd ladder99

#. Install dependencies **in this order** (may take a while). Also make sure to run them **in the ladder99 directory**.

   .. code:: console

      shell/install/linux
      shell/install/docker
      shell/install/node
      shell/install/python
      source ~/.venv/ladder99-venv/bin/activate

Next, we'll run the MTConnect Agent and make sure it works with the demonstration data.
