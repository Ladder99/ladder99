**************
Getting Started
**************

Requirements
-----------------------

- An edge device (e.g. Raspberry Pi) running Linux. 


Installation
-----------------------

#. Start a Terminal window and navigate to home directory

   .. code:: console

      cd ~
   
#. Clone this repo

   .. code:: console

     git clone https://github.com/Ladder99/ladder99

   or if using ssh (can set up so don't need to enter password all the time)

   .. code:: console

     git clone git@github.com:Ladder99/ladder99.git

   then

   .. code:: console

     cd ladder99

#. Set environment variables

   Copy the ``.env-example`` file to ``.env``, modify the values as needed, then set the environment variables with

   .. code:: console
    
      source .env

#. Install dependencies

   Install Docker_, Node_, Python_, and jq_ from their installers. 

   .. code:: console

      sh/install/docker
      sh/install/apps
      sh/install/deps

.. note::

  You can see all the shell commands available with

  .. code:: console

      tree sh
  
.. _Docker: 
.. _Node: 
.. _Python: 
.. _jq: 
