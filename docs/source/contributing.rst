*************************
Contributing
*************************

Build MTConnect Agent Docker image
====================================

Note: This build can take some hours. 

First install more Docker dependencies, including the multiarchitecture build tool, buildx - 

   .. code:: console

      shell/install/docker-dev

Then you can build and deploy the MTConnect Agent Docker image  -

   .. code:: console
      
      shell/agent/build


Build documentation
==================================

This documentation is hosted by readthedocs.org, and is built and deployed automatically on changes being pushed to the GitHub repo. 

To develop and view the documentation locally, first install the Python dependencies, including Sphinx, the documentation generator - 

   .. code:: console

      shell/install/python-dev

Then serve the documents, viewable at localhost:8080 -

   .. code:: console

      shell/docs/serve
