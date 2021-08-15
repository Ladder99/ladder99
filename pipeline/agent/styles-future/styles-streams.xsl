<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:fn="http://www.w3.org/2005/xpath-functions"
  xmlns:m="urn:mtconnect.org:MTConnectDevices:1.7"
  xmlns:s="urn:mtconnect.org:MTConnectStreams:1.7"
  xmlns:js="urn:custom-javascript" exclude-result-prefixes="msxsl js"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt">

  <xsl:template match="s:MTConnectStreams">
    <div class="table-responsive stickytable-container">
      <table class="table table-hover">
        <thead>
          <th>Element</th>
          <th>Id</th>
          <th>Name</th>
          <th>Timestamp</th>
          <th>Sequence</th>
          <th>Value</th>
        </thead>
        <tbody>
          <xsl:for-each select="//*">
            <xsl:variable name="indent" select="count(ancestor::*)" />

            <!-- get style for the row -->
            <!-- so verbose... -->
            <xsl:variable name="weight">
              <xsl:choose>
                <xsl:when test="local-name()='DeviceStream'">bold</xsl:when>
                <xsl:when test="local-name()='Samples'">bold</xsl:when>
                <xsl:when test="local-name()='Events'">bold</xsl:when>
                <xsl:when test="local-name()='Condition'">bold</xsl:when>
                <xsl:otherwise>normal</xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <!-- get element name -->
            <xsl:variable name="element">
              <xsl:choose>
                <xsl:when test="local-name()='Condition'">Conditions</xsl:when>
                <xsl:when test="local-name()='Normal'">Condition</xsl:when>
                <xsl:when test="local-name()='Warning'">Condition</xsl:when>
                <xsl:when test="local-name()='Error'">Condition</xsl:when>
                <xsl:when test="local-name()='Unavailable'">Condition</xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="local-name()" />
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <!-- get value -->
            <xsl:variable name="value">
              <xsl:choose>
                <xsl:when test="local-name()='Normal'">NORMAL</xsl:when>
                <xsl:when test="local-name()='Warning'">WARNING</xsl:when>
                <xsl:when test="local-name()='Error'">ERROR</xsl:when>
                <xsl:when test="local-name()='Unavailable'">UNAVAILABLE</xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="text()" />
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <!-- get value color -->
            <xsl:variable name="valueColor">
              <!-- <xsl:choose> -->
              <!-- <xsl:when test="local-name()='Condition'"> -->
              <xsl:choose>
                <xsl:when test="$value='NORMAL'">#9fe473</xsl:when>
                <xsl:when test="$value='WARNING'">#ffe989</xsl:when>
                <xsl:when test="$value='ERROR'">#e47373</xsl:when>
                <xsl:otherwise>transparent</xsl:otherwise>
              </xsl:choose>
              <!-- </xsl:when> -->
              <!-- </xsl:choose> -->
            </xsl:variable>

            <tr>
              <td>
                <!-- indent according to depth and show type, eg Device, DataItem -->
                <span style="color:white">
                  <xsl:value-of select="substring('xxxxxxxxxxxx',1,$indent)"/>
                </span>

                <!-- add +/- if item has any child elements -->
                <xsl:choose>
                  <xsl:when test="*">
                    <img style="width:12px;" src="/styles/icon-minus.png" />
                  </xsl:when>
                  <xsl:otherwise>
										&#8198; 																																																																																																																																																																																				                    <!-- space -->
                  </xsl:otherwise>
                </xsl:choose>

                <!-- narrow space - see https://stackoverflow.com/questions/8515365/are-there-other-whitespace-codes-like-nbsp-for-half-spaces-em-spaces-en-space -->
								&#8198;

                <span style="font-weight:{$weight};">
                  <xsl:value-of select="$element" />
                </span>
              </td>

              <td>
                <xsl:value-of select="@dataItemId"/>
              </td>
              <td>
                <xsl:value-of select="@name"/>
              </td>
              <td>
                <!-- <xsl:value-of select="@timestamp"/> -->
                <!-- <xsl:value-of select="substring(@timestamp,12)"/> -->
                <xsl:value-of select="translate(@timestamp,'T',' ')"/>
              </td>
              <td>
                <xsl:value-of select="@sequence"/>
              </td>
              <td style="background:{$valueColor};">
                <xsl:value-of select="$value"/>
              </td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </xsl:template>

</xsl:stylesheet>
