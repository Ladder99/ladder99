<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xs="http://www.w3.org/2001/XMLSchema"
	xmlns:fn="http://www.w3.org/2005/xpath-functions"
	xmlns:m="urn:mtconnect.org:MTConnectDevices:1.7">

	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

	<xsl:template match="/">

		<head>
			<meta charset="utf-8"></meta>
			<meta http-equiv="X-UA-Compatible" content="IE=edge"></meta>
			<meta name="viewport" content="width=device-width, initial-scale=1"></meta>
			<title>MTConnect Devices</title>
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
						<div class="navbar-form navbar-left">
							<div class="form-group">
								<input id="fromText" type="text" class="form-control" style="margin-right: 10px;" placeholder="From"/>
								<input id="countText" type="text" class="form-control" style="margin-right: 10px;" placeholder="Count"/>
								<input id="queryText" type="text" class="form-control" style="margin-right: 10px;" placeholder="Query"/>
							</div>
							<button onclick="getSample();" class="btn btn-default">Get Sample</button>
						</div>
					</div>

				</div>
			</nav>

			<div class="container-fluid" style="margin-top: 60px;">
				<p>
					<xsl:apply-templates select="/m:MTConnectDevices/m:Header" />
				</p>
				<xsl:apply-templates select="/m:MTConnectDevices/m:Devices/m:Device" />
			</div>

			<script src="/styles/jquery-1.12.4.min.js"></script>
			<script src="/styles/bootstrap.min.js"></script>
			<script src="/styles/GetSample.js"></script>

		</body>
	</xsl:template>

	<!-- <details open="true">
		<summary>Components</summary>
		<xsl:apply-templates select="*"/>
	</details> -->

	<!-- Header -->
	<xsl:template match="m:Header">
		<div class="panel panel-default panel-heading">
			<details>
				<summary>
					<div class="panel-heading">
						<h3>&#x25B6; Agent</h3>
					</div>
				</summary>
				<div class="panel-body">
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
				</div>
			</details>
		</div>
	</xsl:template>

	<!-- Device -->
	<xsl:template match="m:Device">
		<div class="panel panel-default">
			<div class="panel-heading">
				<div class="container-fluid">
					<div class="row">
						<h2>Device</h2>
						<div class="table-responsive visible-lg visible-md">
							<table class="table table-hover">
								<thead>
									<th>id</th>
									<th>name</th>
									<th>uuid</th>
									<th>sampleInterval</th>
								</thead>
								<tbody>
									<tr>
										<td>
											<xsl:value-of select="@id"/>
										</td>
										<td>
											<xsl:value-of select="@name"/>
										</td>
										<td>
											<xsl:value-of select="@uuid"/>
										</td>
										<td>
											<xsl:value-of select="@sampleInterval"/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

					</div>
				</div>
			</div>
			<div class="panel-body">
				<xsl:apply-templates select="m:Components"/>
			</div>
		</div>
	</xsl:template>

	<!-- Components -->
	<xsl:template match="m:Components">
		<div class="panel-group">
			<details open="true">
				<summary>Components</summary>
				<xsl:apply-templates select="*"/>
			</details>
		</div>
	</xsl:template>

	<xsl:template match="m:Components/*">
		<div class="panel panel-default">
			<div class="panel-heading">
				<div class="container-fluid">
					<div class="row">
						<div class="col-lg-3 col-md-4 hidden-xs">
							<h6 style="margin-bottom: 0px;">ID</h6>
							<h3 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@id"/>
							</h3>
						</div>
						<div class="col-lg-3 col-md-4 col-xs-12">
							<h6 style="margin-bottom: 0px;">Name</h6>
							<h3 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@name"/>
							</h3>
						</div>
						<div class="col-lg-3 col-md-4 hidden-xs">
							<h6 style="margin-bottom: 0px;">Native Name</h6>
							<h3 style="margin-top: 0px; margin-bottom: 5px;">
								<xsl:value-of select="@nativeName"/>
							</h3>
						</div>
					</div>
				</div>
			</div>
			<div class="panel-body">
				<div class="panel-group">
					<xsl:apply-templates select="*"/>
				</div>
			</div>
		</div>
	</xsl:template>

	<!-- DataItems -->
	<xsl:template match="m:DataItems">
		<div class="table-responsive">
			<table class="table table-hover">
				<thead>
					<th>id</th>
					<th>name</th>
					<th>category</th>
					<th>type</th>
					<th>subType</th>
					<th>units</th>
				</thead>
				<tbody>
					<xsl:for-each select="*">
						<tr>
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
								<xsl:value-of select="@units"/>
							</td>
						</tr>
					</xsl:for-each>
				</tbody>
			</table>
		</div>
	</xsl:template>

</xsl:stylesheet>
