# Ladder99 Documentation

Be careful messing with the directory structures here - it's very touchy. In particular, the sphinx-autobuild project might be out of date and not work the same as the Sphinx build command. 

Configuration is set in .readthedocs.yaml and docs/conf.py

Styles can be overridden in source/_static/custom.css.


## Installation

Install Sphinx and Python dependencies with

    docs/shell/install


## Running

Run Sphinx autobuild with

    docs/shell/start

Visit http://localhost:8080


## Developing

Edit files in docs/source - index in index.rst and markdown files for pages. Sphinx autobuild will update the local server files.


## Deploying

Docs are automatically built by readthedocs.org when changes are pushed to the github repo. See https://ladder99.readthedocs.io.


## Contributing

If you notice any documentation is missing or incorrect, please feel free to submit a pull request (PR) to this repo.
