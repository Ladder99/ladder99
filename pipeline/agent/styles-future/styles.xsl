<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xs="http://www.w3.org/2001/XMLSchema"
	xmlns:fn="http://www.w3.org/2005/xpath-functions"
	xmlns:m="urn:mtconnect.org:MTConnectDevices:1.7"
	xmlns:s="urn:mtconnect.org:MTConnectStreams:1.7"
	xmlns:js="urn:custom-javascript" exclude-result-prefixes="msxsl js"
	xmlns:msxsl="urn:schemas-microsoft-com:xslt">

	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

	<!-- Root template -->
	<xsl:template match="/">

		<head>
			<meta charset="utf-8"></meta>
			<meta http-equiv="X-UA-Compatible" content="IE=edge"></meta>
			<meta name="viewport" content="width=device-width, initial-scale=1"></meta>
			<title>Ladder99 Agent</title>
			<link href="/styles/bootstrap.min.css" rel="stylesheet"></link>
			<link href="/styles/styles.css" rel="stylesheet"></link>
		</head>

		<body>
			<nav class="navbar navbar-default navbar-fixed-top">
				<div class="container-fluid">

					<!-- brand and toggle get grouped for better mobile display -->
					<div class="navbar-header">
						<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
						<a class="navbar-brand" style="padding: 5px 10px;" href="#">
							<img alt="Brand" src="/styles/LogoLadder99-text.png" height="40"/>
						</a>
					</div>

					<!-- collect the nav links, forms, and other content for toggling -->
					<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
						<ul class="nav navbar-nav">
							<li>
								<a href="../probe">Probe</a>
							</li>
							<li>
								<a href="../current">Current</a>
							</li>
							<li>
								<a href="../sample">Sample</a>
							</li>
						</ul>
						<div class="navbar-form navbar-left">
							<div class="form-group">
								<input id="fromText" type="text" class="form-control" style="width: 6em; margin-right: 10px;" placeholder="From"/>
								<input id="countText" type="text" class="form-control" style="width: 6em; margin-right: 10px;" placeholder="Count"/>
								<input id="queryText" type="text" class="form-control" style="margin-right: 10px;" placeholder="Query"/>
								<button onclick="showHelp()" class="btn btn-default">?</button>
							</div>
							<button onclick="getSample()" class="btn btn-default">Get Sample</button>
						</div>
					</div>

				</div>
			</nav>

			<div class="container-fluid page-container">
				<!-- <xsl:apply-templates select="/m:MTConnectDevices/m:Header" /> -->
				<!-- <xsl:apply-templates select="/s:MTConnectStreams/s:Header" /> -->
				<!-- <xsl:apply-templates select="/m:MTConnectDevices" /> -->
				<!-- <xsl:apply-templates select="*" /> -->
				<xsl:apply-templates />
				<xsl:apply-templates select="/s:MTConnectStreams" />
			</div>

			<script src="/styles/jquery-1.12.4.min.js"></script>
			<script src="/styles/bootstrap.min.js"></script>
			<script src="https://kit.fontawesome.com/1dd18af014.js" crossorigin="anonymous"></script>
			<script src="/styles/script.js"></script>

		</body>
	</xsl:template>

	<!-- Header template -->
	<xsl:template match="m:Header|s:Header">
		<details style="margin-bottom: 5px;">
			<summary style="font-size:medium;">
				<b>Header</b>
			</summary>
			<table class="table table-hover">
				<thead>
					<xsl:for-each select="@*">
						<th>
							<xsl:value-of select="name()"/>
						</th>
					</xsl:for-each>
				</thead>
				<tbody>
					<tr>
						<xsl:for-each select="@*">
							<td>
								<xsl:value-of select="."/>
							</td>
						</xsl:for-each>
					</tr>
				</tbody>
			</table>
		</details>
	</xsl:template>

	<!-- Probe template -->
	<!-- <xsl:template match="m:Device"> -->
	<!-- <xsl:template match="m:Devices"> -->
	<xsl:template match="m:MTConnectDevices">
		<!-- <xsl:template match="/"> -->
		<div class="table-responsive stickytable-container">
			<table class="table table-hover">
				<thead>
					<th>Element</th>
					<th>Id</th>
					<th>Name</th>
					<th>Category</th>
					<th>Type</th>
					<th>SubType</th>
				</thead>
				<tbody>
					<!-- <xsl:for-each select="//*[local-name(.) != 'Agent']"> -->
					<xsl:for-each select="//*">
						<!-- <xsl:for-each select="*[local-name(.) != 'Agent']//*"> -->
						<!-- <xsl:for-each select="*[local-name(.) != 'Agent']/descendent-or-self::node()"> -->
						<xsl:variable name="indent" select="count(ancestor::*)" />
						<!-- <xsl:variable name="isDevice" select="local-name(.) == 'Device'" /> -->
						<tr>
							<td>
								<!-- indent according to depth and show type, eg Device, DataItem -->
								<span style="color:white">
									<xsl:value-of select="substring('xxxxxxxxxxxx',1,$indent)"/>
								</span>
								<i class="far fa-plus-square" style="color:#aaa"></i>
								<span style="color:white">.</span>
								<xsl:value-of select="local-name()"/>
							</td>
							<td>
								<xsl:value-of select="@id"/>
							</td>
							<td>
								<xsl:value-of select="@name"/>
							</td>
							<td>
								<xsl:value-of select="@category"/>
							</td>
							<td>
								<xsl:value-of select="@type"/>
							</td>
							<td>
								<xsl:value-of select="@subType"/>
							</td>
						</tr>
					</xsl:for-each>
				</tbody>
			</table>
		</div>
	</xsl:template>

	<!-- Current/Sample template -->
	<xsl:template match="s:MTConnectStreams">
		<div class="table-responsive stickytable-container">
			<table class="table table-hover">
				<thead>
					<th>Element</th>
					<th>Id</th>
					<th>Name</th>
					<th>SubType</th>
					<th>Timestamp</th>
					<th>Sequence</th>
					<th>Value</th>
				</thead>
				<tbody>
					<xsl:for-each select="//*">
						<xsl:variable name="indent" select="count(ancestor::*)" />
						<!-- so verbose... -->
						<xsl:variable name="weight">
							<xsl:choose>
								<xsl:when test="$indent=1">
									<xsl:text>bold</xsl:text>
								</xsl:when>
								<xsl:otherwise>
									<xsl:text>normal</xsl:text>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:variable>

						<tr>
							<td>
								<!-- indent according to depth and show type, eg Device, DataItem -->
								<span style="color:white">
									<xsl:value-of select="substring('xxxxxxxxxxxx',1,$indent)"/>
								</span>
								<i class="far fa-plus-square" style="color:#aaa"></i>
								<!-- why &nbsp; no work here? -->
								<span style="color:white">.</span>
								<span style="font-weight:{$weight};">
									<xsl:value-of select="local-name()"/>
								</span>
							</td>
							<td>
								<!-- <i class="fas fa-cogs"></i> -->
								<xsl:value-of select="@dataItemId"/>
							</td>
							<td>
								<xsl:value-of select="@name"/>
							</td>
							<td>
								<xsl:value-of select="@subType"/>
							</td>
							<td>
								<!-- replace T with space? -->
								<xsl:value-of select="@timestamp"/>
							</td>
							<td>
								<xsl:value-of select="@sequence"/>
							</td>
							<td>
								<xsl:value-of select="text()"/>
							</td>
						</tr>
					</xsl:for-each>
				</tbody>
			</table>
		</div>
	</xsl:template>


</xsl:stylesheet>
