	var map;
	var marker;
	var info;
	var icons;
	var sidebar_html=""; // <-- don't remove the "" !
	function prepareIcons() {
		var point = new GPoint(10, 10);
		var size = new GSize(20, 20);
		var icons = new Array(10);
		for(var i = 1; i < 10; i++) {
			icons[i] = new GIcon();
			icons[i].image = "http://www.vesseltracker.com/images/googlemaps/icon"+i+".png";
			icons[i].iconAnchor = point;
			icons[i].iconSize = size;
			icons[i].infoWindowAnchor = point;
			}
		return icons;
		}
	function opener(i) {
		marker[i].openInfoWindowHtml(info[i]);
		}
	function makeOpenerCaller(i) {
		return function() {
			opener(i);
			}
		}
	function createMarker(point, icon, i) {
		marker[i] = new GMarker(point, icon);
		GEvent.addListener(marker[i], 'click', makeOpenerCaller(i));
		map.addOverlay(marker[i]);
		}
		
		function encodeShipnameForUrl(name)
		{
    	tokens = name.split(" ");
    	size = tokens.length;
    	if(size>0) 	ret = tokens[0];
    	for(i=1; i<size; i++)
    		{
        	ret += "-";
        	ret += tokens[i];
    		}
    	return ret;
		}	
		
		
		function encodeShipname(name)
		{
			var parts = name.split(" ");
			var ret = "";
			for (part in parts)
			{
				if (parts[part] == "MV")
				{
				  ret += parts[part];
				}
				else
				{
					var namepart = parts[part];
					var head = namepart.substring(0,1);
					var tail = namepart.substring(1);
					ret += " " +  head.toUpperCase() + tail.toLowerCase();
				}
			}
			return ret;
		}

		
		
		
	function getUrlParams()
	{
		var strVars = window.location.search;
		strVars = strVars.replace("?","");
		var splitVars = new Array();
		var vars = new Array();
		splitVars = strVars.split("&");
		for(i=0;i<splitVars.length;i++)
		{
		var tmp = splitVars[i].split("=");
		var nname = tmp[0];
		vars[nname] = tmp[1];
		}
		return vars;
	}
	
	
	
	function readMap(icons)  {
		var request = GXmlHttp.create();

		var params = getUrlParams();
		
		if (params['file'] == null)
		{
		  return;
		}
		
		//request.open("GET", params["file"] + ".xml", true);
		//request.open("GET", "owner_6277.xml", true);
		request.open("GET", "http://www.vesseltracker.com/aisserver/googleMapsNew/" + params["file"] + ".xml", true);
		request.onreadystatechange = function() {
			if (request.readyState == 4) {
				var xmlDoc = request.responseXML;
				var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
				marker = new Array(markerElements.length);
				info = new Array(markerElements.length);
				sidebar_html = "- ";
				for(var i = 0; i < markerElements.length; i++) {
					var pt = new GLatLng(parseFloat(markerElements[i].getAttribute("lat")), parseFloat(markerElements[i].getAttribute("lng")));
					var icon = parseInt(markerElements[i].getAttribute("icon"));
					var name = markerElements[i].getAttribute("name");
					
					
					if (markerElements[i].getAttribute("imo") != null)
						{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-" + markerElements[i].getAttribute("imo") + ".html";
						}
					else
						{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-I" + markerElements[i].getAttribute("id") + ".html";
						}
					
					var info1 = "<strong><a href=\"" + shipURL + "\" target=\"_blank\">" + name + "</a></strong><br>";
						if (markerElements[i].getAttribute("last") != null) { info1 += "letzte Sichtung: " + markerElements[i].getAttribute("last") + " "; }
						
					var info2 = "";
						if (markerElements[i].getAttribute("v") != null) { info2 += "Geschwindigkeit: " +	markerElements[i].getAttribute("v") + "  " ; }
						if (markerElements[i].getAttribute("call") != null) { info2 += "Rufzeichen: " +	markerElements[i].getAttribute("call") + "<br/>" ; }
						if (markerElements[i].getAttribute("imo") != null) { info2 += "IMO-Nr.: " +	markerElements[i].getAttribute("imo") + "<br/>" ; }
						if (markerElements[i].getAttribute("length") != null) { info2 += "L&auml;nge: " +	markerElements[i].getAttribute("length") + "<br/>" ; }
						if (markerElements[i].getAttribute("width") != null) { info2 += "Breite: " +	markerElements[i].getAttribute("width") + "<br/>" ; }
						sidebar_html += "<a style='color:#555555' href='javascript:opener(" + i + ")'>" + encodeShipname(name) + "</a> - ";
						//info3 += endtag;
					
						//info[i] = info1 + "<br>" + info3;
					
						info[i] = info1 + "<br>" + info2;
					
					//var info1 =  "<br>" + name;
					//info[i] = info1;
					createMarker(pt, icons[icon], i);
					}
					var elemSidebar = document.getElementById("sidebar");
					elemSidebar.innerHTML = sidebar_html;
				}
			}
		request.send(null);
		}
		
		function reloadMap()
		{
			map.clearOverlays(),
			readMap(icons);
			window.setTimeout("reloadMap()",90000);

		}
	function onLoad() {
		if (GBrowserIsCompatible()) {
			icons = prepareIcons();
			var params = getUrlParams();
			var lat = params['lat'];
			var lon = params['lon'];
			var z = parseInt(params['z']);
			map = new GMap2(document.getElementById("map"),{mapTypes: [G_MAP_TYPE,G_SATELLITE_TYPE]});
			map.addControl(new GLargeMapControl());
			map.addControl(new GMapTypeControl());
			map.setCenter(new GLatLng(lat, lon), z);
			window.setTimeout("reloadMap()",90000);
			readMap(icons);
			}
		else {
			alert("Your browser is not compatible with Google Maps. Please use the Internet Explorer 7 or Mozilla Firefox.");
			}
		}
