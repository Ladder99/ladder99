*************************
Contributing
*************************


Build MTConnect Agent Docker image
====================================

See https://github.com/Ladder99/mtconnect-agent. 


Build MTConnect Adapter Docker image
====================================

Build a multiarchitecture Docker image and deploy it to our Ladder99 Docker Hub -

   .. code:: console

      shell/adapter/build


Build documentation
==================================

This documentation is hosted by readthedocs.org, and is built and deployed automatically on changes being pushed to the GitHub repo. 

To develop and view the documentation locally, first install the Python dependencies, including Sphinx, the documentation generator - 

   .. code:: console

      shell/install/python-dev

Then serve the documents, viewable at localhost:8080 -

   .. code:: console

      shell/docs/serve
