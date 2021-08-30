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

			<!-- Header with logo, navigation, form and buttons -->
			<nav class="navbar navbar-inverse navbar-fixed-top">
				<div class="container-fluid">
					<div class="navbar-header">
						<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
						<a class="navbar-brand" style="padding: 5px 10px;" href="https://mtconnect.org" target="_blank" rel="noopener noreferrer">
							<!-- <img alt="Brand" src="/styles/LogoLadder99-text.png"/> -->
							<!-- <img alt="Brand" src="/styles/LogoMTConnect.png"/> -->
							<!-- <img alt="Brand" src="/styles/LogoMTConnect-alpha.png"/> -->
							<img alt="Brand" src="/styles/LogoMTConnect-shadow.png?v=3"/>
						</a>
					</div>
					<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
						<ul class="nav navbar-nav">
							<li id="tab-probe">
								<a href="../probe">Probe</a>
							</li>
							<li id="tab-current">
								<a href="../current">Current</a>
							</li>
							<li id="tab-sample">
								<a href="../sample">Sample</a>
							</li>
						</ul>
						<form class="navbar-form navbar-left" onsubmit="return false;">
							<div class="form-group">
								<input id="path" type="text" class="form-control" style="width: 18em; margin-right: 6px;" placeholder="Path"/>
								<input id="from" type="text" class="form-control" style="width: 6em; margin-right: 6px;" placeholder="From"/>
								<input id="count" type="text" class="form-control" style="width: 6em; margin-right: 6px;" placeholder="Count"/>
								<button type="submit" onclick="fetchData()" class="btn" style="margin-right: 6px;">Fetch</button>
								<button id="autorefresh" type="button" class="btn" style="margin-right: 6px;">Autorefresh</button>
								<button id="xml" onclick="showXml()" type="button" class="btn" style="margin-right: 6px;">XML</button>
								<button type="button" class="btn" data-toggle="modal" data-target="#myModal" style="margin-right: 6px;">?</button>
							</div>
						</form>
					</div>
				</div>
			</nav>

			<!-- Main contents -->
			<div class="container-fluid page-container">
				<xsl:apply-templates />
				<!-- the iframe automatically applies the stylesheet also -->
				<!-- <iframe id="iframe" src="http://localhost:5000/current" /> -->
				<!-- <textarea id="textarea" rows="100" cols="100" readonly="true" /> -->
			</div>


			<!-- Modal -->
			<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
				<div class="modal-dialog modal-dialog-centered" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<button type="button" class="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">x</span>
							</button>
							<!-- <h3 class="modal-title" id="myModalLabel">Ladder99 Agent</h3> -->
							<h3 class="modal-title" id="myModalLabel">MTConnect Agent</h3>
						</div>
						<div class="modal-body">

							<p>MTConnect Agent receives data from one or more devices and makes it available as XML, a text data format. It can also transform the XML into HTML, as seen on this page. </p>

							<!-- <h4>Tabs</h4>
							<ul>
								<li>
									<b>Probe</b> shows the structure of the available devices and their data items.</li>
								<li>
									<b>Current</b> shows the latest values for each data item, along with a timestamp.</li>
								<li>
									<b>Sample</b> shows a sequence of values and their timestamps.</li>
							</ul> -->

							<h4>Probe</h4>
							<p>This tab shows the structure of the available devices and their data items.</p>

							<h4>Current</h4>
							<p>This tab shows the latest values for each data item, along with a timestamp.</p>

							<h4>Sample</h4>
							<p>This tab shows a sequence of values and their timestamps.</p>

							<h4>Path</h4>
							<p>You can search the available data using a simple query language called <a href="https://en.wikipedia.org/wiki/XPath">XPath</a>, e.g.</p>
							<p>Note: these will give an error if the given path cannot be found in the document.</p>
							<ul>
								<li>Availability of all devices: <a href='../current?path=//DataItem[@type="AVAILABILITY"]'>//DataItem[@type="AVAILABILITY"]</a>
								</li>
								<li>All condition statuses: <a href='../current?path=//DataItems/DataItem[@category="CONDITION"]'>//DataItems/DataItem[@category="CONDITION"]</a>
								</li>
								<li>All controller data items: <a href='../current?path=//Controller/*'>//Controller/*</a>
								</li>
								<li>All linear axis data items: <a href='../current?path=//Axes/Components/Linear/DataItems'>//Axes/Components/Linear/DataItems</a>
								</li>
								<li>X-axis data items: <a href='../current?path=//Axes/Components/Linear[@id="x"]'>//Axes/Components/Linear[@id="x"]</a>
								</li>
								<li>Door status: <a href='../current?path=//Door'>//Door</a>
								</li>
							</ul>

							<h4>From/Count</h4>
							<p>The MTConnect Agent stores a certain number of observations, called sequences. You can specify which ones and how many to view with the <b>From</b> and <b>Count</b> fields.</p>

							<h4>Fetch</h4>
							<p>Click Fetch to retrieve Current or Sample data - if From or Count values are supplied, the relevant Sample data will be shown.</p>

							<h4>Autorefresh</h4>
							<p>Toggles autorefresh of page every 2 seconds.</p>

							<h4>XML</h4>
							<p>Click the XML button to open the underlying raw XML in a new tab.</p>

							<!-- <h4>How it works</h4> -->
							<!-- The <b>Ladder99 Agent</b> transforms the XML data from the MTConnect Agent  -->
							<!-- into a spreadsheet-like UI.</p> -->
							<!-- <p>Note: Conditions are transformed from Normal, Warning, Fault elements to Condition elements with value of NORMAL, WARNING, FAULT.</p> -->

							<h4>Note</h4>
							<p>Conditions are transformed from Normal, Warning, Fault elements to Condition elements with value of NORMAL, WARNING, FAULT.</p>

							<h4>About</h4>
							<p>For more information on MTConnect, see <a href="https://mtconnect.org">MTConnect.org</a>.
							</p>
							<!-- <p>For more information, see <a href="https://mtconnect.org">MTConnect.org</a>, -->
							<!-- and the <a href="https://docs.ladder99.com">Ladder99 documentation</a>. -->
							<!-- </p> -->
							<!-- <p>Ladder99 is developed by <a href="https://mriiot.com">MRIIOT</a>, your agile digital transformation partner.</p> -->
							<p>This UI was developed by <a href="https://mriiot.com">MRIIOT</a>, your agile digital transformation partner.</p>
							<p>License: MIT</p>
							<!-- <p>This UI was developed by <a href="https://mriiot.com">MRIIOT</a>, your agile digital transformation partner. -->
							<!-- Our signature product, <a href="https://mriiot.com/ladder99">Ladder99</a>, extends the ecosystem around MTConnect with module drivers and more.</p> -->
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
						</div>
					</div>
				</div>
			</div>

			<button onclick="gotoTop()" id="gotoTop" title="Go to top">
				<img src="/styles/icon-up.png"/>
			</button>

			<!-- note: jquery is needed for bootstrap modal -->
			<script src="/styles/jquery-1.12.4.min.js"></script>
			<script src="/styles/bootstrap.min.js"></script>
			<script src="/styles/script.js"></script>

		</body>
	</xsl:template>

	<!-- include other templates -->
	<xsl:include href="styles-probe.xsl"/>
	<xsl:include href="styles-streams.xsl"/>
	<xsl:include href="styles-error.xsl"/>
	<!-- <xsl:include href="styles-plain.xsl"/> -->

</xsl:stylesheet>
