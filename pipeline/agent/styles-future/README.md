# Ladder99 Agent Stylesheets

Adapted for Ladder99 from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

To keep up-to-date with MTConnect standard, change the version in the xsl:stylesheet element in styles.xsl.

The MTConnect cppagent doesn't allow using subfolders in the styles folder, so keep it flat.

## About

XML Stylesheet for MTConnect Agents using [Bootstrap](http://getbootstrap.com/). This provides a better appearance than the default stylesheet and also adds the ability to switch between Probe, Current, and Sample requests.

## Installation

1. Copy the contents of this repository into the "Styles" folder for the MTConnect Agent.

2. Edit the Agent's configuration file (ex. agent.cfg) to look for the stylesheets as shown below:

### Agent.cfg

```
Files {
    styles {
        Path = ../styles
        Location = /styles/
    }
    Favicon {
        Path = ../styles/favicon.ico
        Location = /favicon.ico
    }
}

DevicesStyle { Location = /styles/styles.xsl }
StreamsStyle { Location = /styles/styles.xsl }

```

3. Restart Agent
4. Navigate to Agent's url to view

## License

MIT
