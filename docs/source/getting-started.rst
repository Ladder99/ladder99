**************
Getting Started
**************

Set up your environment
-----------------------

#. Start a Terminal window

#. Clone this repo

    .. code:: console

      $ git clone https://github.com/Ladder99/ladder99

    or if using ssh (can set up so don't need to enter pw all the time)

    .. code:: console

      $ git clone git@github.com:Ladder99/ladder99.git

    then

    .. code:: console

      $ cd ladder99


#. Set environment variables

  Get a copy of the .env file, or modify the existing .env-example file, then set the environment variables with

  .. code:: console
    
    source .env


.. tabs::

  .. tab:: Desktop (Mac/Linux)

      Install Docker, Node, jq, and Python3 from their installers. 

      Install all other dependencies with

          sh/install/apps
          sh/install/deps

  .. tab:: Edge device (e.g. Raspberry Pi)

      Install Docker and other dependencies -

          sh/install/docker
          sh/install/apps
          sh/install/deps

.. note::

  You can see all the Mac/Linux shell commands available with

  .. code:: console

      tree sh
  
.. _Webpack: https://webpack.js.org/
.. _node-sass: https://github.com/sass/node-sass
.. _SASS: http://www.sass-lang.com
.. _Wyrm: http://www.github.com/snide/wyrm/
.. _Sphinx: http://www.sphinx-doc.org/en/stable/
