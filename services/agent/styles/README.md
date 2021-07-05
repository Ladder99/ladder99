# Ladder99-Agent Stylesheets

Adapted for Ladder99 from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

To keep up-to-date with MTConnect standard, change the version in the xsl:stylesheet element in Devices.xsl and Streams.xsl.

Note: Changes should be made to BOTH Devices.xsl and Streams.xsl, where applicable.

The MTConnect cppagent doesn't seem to allow using subfolders in the styles folder, so keep it flat.

## About

XML Stylesheet for MTConnect Agents using [Bootstrap](http://getbootstrap.com/). This provides a better appearance than the default stylesheet and also adds the ability to switch between Probe, Current, and Sample requests.

### File Size

Just over 300 KB. This Includes the necessary files for jQuery, Bootstrap, and the logo image.

## Installation

1. Copy the contents of this repository (you can exclude the .git folder) into the "Styles" folder for the MTConnect Agent.

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

DevicesStyle { Location = /styles/Devices.xsl }

StreamsStyle { Location = /styles/Streams.xsl }

```

3. Restart Agent
4. Navigate to Agent's url to view

## Customization

This stylesheet is easily customizable using the Custom.css file. Customizations can include any overrides of the standard bootstrap styles such as changing the colors of the panel headers. The logo and link can be changed by editing the following lines in both Devices.xsl and Streams.xsl as shown below:

```xml
<a class="navbar-brand" style="padding: 5px 20px;" href="http://www.mtconnect.org">
	<img alt="Brand" src="/styles/MTConnect-Logo.png" height="40"/>
</a>
```

## Contributions

Contributions to this project are welcome and please feel free to contact us directly at info@trakhound.org.

## License

This project is licensed under the MIT software license.
