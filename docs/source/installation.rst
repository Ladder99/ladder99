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

#. Set environment variables

   Copy the ``.env-example`` file to ``.env`` and modify the passwords as needed, then load the environment variables

   .. code:: console

      cp .env-example .env
      nano .env   
      source .env

#. Install dependencies **in this order** (may take a while). Also make sure to run them **in the ladder99 directory**.

   .. code:: console

      sh/install/linux
      sh/install/docker
      sh/install/python
      sh/install/node

   .. note::

      You can see all the available shell commands with ``tree sh``.

#. Activate the Python virtual environment

   .. code:: console

      source ~/.venv/ladder99-venv/bin/activate


.. _Docker: https://www.docker.com/
.. _Node: https://nodejs.org/en/
.. _Python: https://www.python.org/
.. _jq: https://stedolan.github.io/jq/
