<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:fn="http://www.w3.org/2005/xpath-functions"
  xmlns:m="urn:mtconnect.org:MTConnectDevices:1.7"
  xmlns:s="urn:mtconnect.org:MTConnectStreams:1.7"
  xmlns:e="urn:mtconnect.org:MTConnectError:1.7"
  xmlns:js="urn:custom-javascript" exclude-result-prefixes="msxsl js"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt">

  <!-- this template doesn't work because the agent doesn't assign the styles.xsl -->
  <!-- stylesheet to the xml -->
  <!-- maybe in the future though -->
  <xsl:template match="m:MTConnectError">
	  ERROR
  </xsl:template>

</xsl:stylesheet>
