*******************
Getting Started
*******************

Let's run the MTConnect Agent, which comes with a simulator for a CNC device.

On your edge device, 

   note: this may give an error if the docker image is still set to private, in which case ``docker login``

   .. code:: console

      cd ~/ladder99
      shell/agent/test

Now you should be able to view the MTConnect Agent output on your browser at (e.g.) http://raspberrypi.local:5000.

.. image:: _images/agent.jpg
