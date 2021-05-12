*************************
Contributing
*************************


Building Agent image
====================================

The Agent image should only need to be built to handle another architecture, or keep up-to-date with the latest cppagent version -

See https://github.com/Ladder99/mtconnect-agent. 


Building Adapter image
====================================

If you develop a plugin for the adapter or make other changes to it, build a multiarchitecture Docker image and deploy it to our Ladder99 Docker Hub -

   .. code:: console

      shell/adapter/build


Building documentation
==================================

This documentation is hosted by readthedocs.org, and is built and deployed automatically on changes being pushed to the GitHub repo. 

To develop and view the documentation locally, first install the Python dependencies, including Sphinx, the documentation generator - 

   .. code:: console

      shell/install/python-dev

Then serve the documents, viewable at localhost:8080 -

   .. code:: console

      shell/docs/serve


Issues
===============

If you come across any issues, or have feature requests, feel free to file an issue on our GitHub repo - https://github.com/Ladder99/ladder99/issues.

You can also write us directly at ladder99@mriiot.com.
