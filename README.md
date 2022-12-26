# Ladder99

[![License](https://img.shields.io/badge/license-Apache2.0-green)](./LICENSE)
[![Open Issues](https://img.shields.io/github/issues/Ladder99/ladder99.svg)](https://github.com/Ladder99/ladder99/issues)
[![Github Stars](https://img.shields.io/github/stars/Ladder99/ladder99.svg)]()
[![follow @ladder99](https://badgen.net/twitter/follow/ladder99_com)](https://twitter.com/ladder99_com)

<!-- [![Medium](https://img.shields.io/badge/Medium-12100E?logo=medium&style=flat)](https://medium.com/@ladder99) -->
<!-- [![Github code size in bytes](https://img.shields.io/github/languages/code-size/Ladder99/ladder99.svg)]() -->
<!-- [![Formatted with Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) -->
<!-- <a href="https://codecov.io/gh/Ladder99/neomem"><img alt="Codecov Coverage Status" src="https://img.shields.io/ladder99/c/github/Ladder99/ladder99.svg?style=flat"></a> -->

Ladder99 is a free and open source software pipeline that transfers data from factory devices to a database and end-user visualizations using MTConnect, an open standard.

MTConnect standardizes factory device data flow and vocabulary - it was started by UC Berkeley, Georgia Institute of Technology, and Sun Microsystems in 2008, and continues under active development.

Ladder99 is developed by MRIIOT, your agile digital transformation partners.

![screenshot](docs/images/screenshots/agent-html_1200.jpg)

## Folders

- dashboards - generic dashboard definitions, usable by any client
- modules - dataitem definitions - input/output yamls, recordings for playback
- services - source code for different sections of the pipeline - adapter, agent, compiler, etc.
- setups - example setups to demonstrate different modules
- shell - shell scripts

Adapter plugins are defined in services/adapter/src/drivers.

## Links

For the Ladder99 documentation, see https://docs.ladder99.com.

For more on MTConnect, see https://www.mtconnect.org.

For more on MRIIOT and what we offer, see https://mriiot.com.

For architecture, design decisions, and milestones/versions/branches, see the [internal docs](docs).

## License

Apache 2.0
