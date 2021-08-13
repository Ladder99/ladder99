<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xs="http://www.w3.org/2001/XMLSchema"
	xmlns:fn="http://www.w3.org/2005/xpath-functions"
	xmlns:m="urn:mtconnect.org:MTConnectStreams:1.7"
	xmlns:js="urn:custom-javascript" exclude-result-prefixes="msxsl js"
	xmlns:msxsl="urn:schemas-microsoft-com:xslt">

	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

	<xsl:template match="/">

		<head>
			<meta charset="utf-8"></meta>
			<meta http-equiv="X-UA-Compatible" content="IE=edge"></meta>
			<meta name="viewport" content="width=device-width, initial-scale=1"></meta>
			<title>MTConnect Device Streams</title>
			<!-- autorefresh - works but resets page position -->
			<!-- <meta http-equiv="refresh" content="2"></meta> -->
			<link href="/styles/bootstrap.min.css" rel="stylesheet"></link>
			<link href="/styles/Custom.css" rel="stylesheet"></link>
		</head>

		<body>

			<nav class="navbar navbar-default navbar-fixed-top">
				<div class="container-fluid">
					<!-- Brand and toggle get grouped for better mobile display -->
					<div class="navbar-header">
						<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
						<a class="navbar-brand" style="padding: 5px 20px;" href="#">
							<img alt="Brand" src="/styles/Ladder99Logo-gray.png" height="40"/>
						</a>
					</div>
					<!-- Collect the nav links, forms, and other content for toggling -->
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
						<div class="navbar-form navbar-left hidden-sm hidden-xs">
							<div class="form-group">
								<input id="fromText" type="text" class="form-control" style="margin-right: 10px;" placeholder="From"/>
								<input id="countText" type="text" class="form-control" style="margin-right: 10px;" placeholder="Count"/>
							</div>
							<button onclick="getSample();" class="btn btn-default">Get Sample</button>
						</div>
					</div>
				</div>
			</nav>

			<div class="container-fluid page-container">
				<!-- <xsl:apply-templates select="/m:MTConnectStreams/m:Header" /> -->
				<xsl:apply-templates select="/m:MTConnectStreams/m:Streams/m:DeviceStream" />
			</div>

			<!-- <footer class="footer" style="margin-top: 20px; margin-bottom: 20px;">
				<div class="container">
					<div class="row">
							<p class="col-md-3 text-muted">This template is designed by Feenux LLC and is available for use through the MIT license.</p>
							<p class="col-md-3 text-muted">Source code for this template is available at 
								<a href="https://github.com/TrakHound/MTConnect-Agent-Stylesheet">GitHub</a>
							</p>
							<p class="col-md-3 text-muted">© 2016 Feenux LLC, All Rights Reserved</p>
						</div>
				</div>
			</footer> -->

			<script src="/styles/jquery-1.12.4.min.js"></script>
			<script src="/styles/bootstrap.min.js"></script>
			<script src="/styles/GetSample.js"></script>
		</body>
	</xsl:template>

	<xsl:template match="m:DeviceStream">

		<div class="table-responsive stickytable-container">
			<table class="table table-hover">
				<thead>
					<th>Element</th>
					<th>Id</th>
					<th>Name</th>
					<th>Category</th>
					<th>Type</th>
					<th>SubType</th>
					<th>Value</th>
					<th>Units</th>
				</thead>
				<tbody>
					<!-- <xsl:for-each select="//*[local-name(.) != 'Agent']"> -->
					<!-- works but includes Agent and descendents -->
					<!-- <xsl:for-each select="//*"> -->
					<!-- works but doesn't include Device row -->
					<xsl:for-each select="*[local-name(.) != 'Agent']//*">
						<!-- <xsl:for-each select="*[local-name(.) != 'Agent']/descendent-or-self::node()"> -->
						<xsl:variable name="indent" select="count(ancestor::*)" />
						<!-- <xsl:variable name="isDevice" select="local-name(.) == 'Device'" /> -->
						<tr>
							<td>
								<!-- indent according to depth -->
								<span style="color:white">
									<xsl:value-of select="substring('............',1,$indent)"/>
								</span>
								<!-- show element type, eg Device, DataItem -->
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
							<td>
								<xsl:value-of select="@value"/>
							</td>
							<td>
								<xsl:value-of select="@units"/>
							</td>
						</tr>
					</xsl:for-each>
				</tbody>
			</table>
		</div>

	</xsl:template>

	<!-- <xsl:template match="m:DeviceStream">

		<div class="panel panel-default">
			<div class="panel-heading">
				<div class="container-fluid">
					<div class="row">

						<div class="col-lg-3 col-md-4 col-xs-12">
							<h6 style="margin-bottom: 0px;">Device</h6>
							<h2 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@name"/>
							</h2>
						</div>

						<div class="col-lg-3 col-md-4 hidden-xs">
							<h6 style="margin-bottom: 0px;">ID</h6>
							<h4 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@id"/>
							</h4>
						</div>

						<div class="col-lg-3 col-md-4 hidden-xs">
							<h6 style="margin-bottom: 0px;">UUID</h6>
							<h4 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@uuid"/>
							</h4>
						</div>

					</div>
				</div>
			</div>

			<div class="panel-body">
				<xsl:apply-templates select="m:ComponentStream"/>
			</div>

		</div>

	</xsl:template> -->

	<xsl:template match="m:Header">

		<div class="panel panel-default">
			<div class="panel-heading">
				<i class="fa fa-bar-chart-o fa-fw"></i>Agent Information
			</div>

			<div class="panel-body">

				<!-- Standard Header Table-->
				<table class="table table-hover visible-lg visible-md">
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

				<!-- Small/Mobile Header List -->
				<ul class="list-group visible-sm visible-xs">
					<xsl:for-each select="@*">
						<li class="list-group-item col-md-3">
							<h6 class="list-group-item-header">
								<xsl:value-of select="name()"/>
							</h6>
							<h4 class="list-group-item-text">
								<xsl:value-of select="." />
							</h4>
						</li>
					</xsl:for-each>
				</ul>

			</div>
		</div>

	</xsl:template>

	<xsl:template match="m:ComponentStream">

		<div style="margin-left: 10px;">
			<h6 style="margin-bottom: 0px;">
				<xsl:value-of select="@component" />
			</h6>
			<h3 style="margin-top: 0px; margin-bottom: 5px;">
				<xsl:value-of select="@name" />
			</h3>
		</div>

		<div class="panel-group">
			<xsl:apply-templates select="	m:Samples"/>
			<xsl:apply-templates select="	m:Events"/>
			<xsl:apply-templates select="	m:Condition"/>
		</div>

	</xsl:template>

	<xsl:template match="*">

		<div class="panel panel-default">

			<div class="panel-heading">
				<i class="fa fa-bar-chart-o fa-fw"></i>
				<xsl:value-of select="name()"/>
			</div>

			<div class="panel-body">

				<!-- Standard Table -->
				<div class="table-responsive visible-lg visible-md">
					<table class="table table-hover">
						<thead>
							<th>Timestamp</th>
							<th>Type</th>
							<th>Sub Type</th>
							<th>Name</th>
							<th>Id</th>
							<th>Sequence</th>
							<th>Value</th>
						</thead>
						<tbody>
							<xsl:for-each select="*">
								<tr>
									<td>
										<xsl:value-of select="@timestamp"/>
									</td>
									<td>
										<xsl:value-of select="name()"/>
									</td>
									<td>
										<xsl:value-of select="@subType"/>
									</td>
									<td>
										<xsl:value-of select="@name"/>
									</td>
									<td>
										<xsl:value-of select="@dataItemId"/>
									</td>
									<td>
										<xsl:value-of select="@sequence"/>
									</td>
									<td>
										<xsl:value-of select="."/>
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</div>

				<!-- Small Table -->
				<div class="table-responsive hidden-xs visible-sm">
					<table class="table table-hover hidden-xs visible-sm">
						<thead>
							<th>Type</th>
							<th>Name</th>
							<th>Id</th>
							<th>Value</th>
						</thead>
						<tbody>
							<xsl:for-each select="*">
								<tr>
									<td>
										<xsl:value-of select="name()"/>
									</td>
									<td>
										<xsl:value-of select="@name"/>
									</td>
									<td>
										<xsl:value-of select="@dataItemId"/>
									</td>
									<td>
										<xsl:value-of select="."/>
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</div>

				<!-- Extra Small List -->
				<ul class="list-group visible-xs">
					<xsl:for-each select="*">
						<li class="list-group-item col-sm-12">
							<h6 class="list-group-item-header">
								<xsl:value-of select="@dataItemId"/>
							</h6>
							<h4 class="list-group-item-text">
								<xsl:value-of select="."/>
							</h4>
						</li>
					</xsl:for-each>
				</ul>
			</div>
		</div>

	</xsl:template>

</xsl:stylesheet>
