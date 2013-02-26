var vtMap;

function reloadMap()
{
	var jetzt = new Date();
	var ts = jetzt.getTime();
	var request = OpenLayers.Request.GET({url: "vessels.xml?id="+ts, callback: refreshMap});
}

function refreshMap(request)
{
	var xmlDoc = request.responseXML;
	var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
	vtMap.addVessels(markerElements);
}



function init()
{
	vtMap =  new VtMap("map");
	vtMap.init();
	//vtMap.setCenter(10.02345,53.56871,13);
	//vtMap.addMarker(10.02345,53.56871,"drachen.gif");
	vtMap.addControl("Navigation");
	vtMap.addControl("MousePosition");
	vtMap.addControl("MouseDefaults");
	//vtMap.addControl("LayerSwitcher");
	vtMap.addControl("PanZoomBar");
	reloadMap();
//	var points = [new OpenLayers.Geometry.Point(9.98236, 53.49090),new OpenLayers.Geometry.Point(9.98236,53.49058),
//	              new OpenLayers.Geometry.Point(9.98252, 53.49058), new OpenLayers.Geometry.Point(9.98252, 53.49090),
//	              new OpenLayers.Geometry.Point(9.98244, 53.49100)];
//	vtMap.addPolygon(points);
//	vtMap.setCenter(9.98236, 53.49090,16);
}

