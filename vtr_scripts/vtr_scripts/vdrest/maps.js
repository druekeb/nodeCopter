	var map;
	var marker;
	var info;
	var icons;
	var sidebar_html=""; // <-- don't remove the "" !
	function prepareIcons() {
		var point = new GPoint(10, 10);
		var size = new GSize(20, 20);

		icons = new Array(15);
    		for(var i = 1; i < 10; i++) 
    		{
			icons[i] = new GIcon();
			icons[i].image = 'http://images.vesseltracker.com/images/googlemaps/icon'+i+'.png';
			icons[i].iconAnchor = point;
                        icons[i].iconSize = size;
                        icons[i].infoWindowAnchor = point;
    		}
    
		icons['moored'] = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
    		icons['anchorage'] = icons[5];
    		icons['waiting'] = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
		
 		icons['_lastpos'] = new GIcon();
                icons['_lastpos'].image = 'http://images.vesseltracker.com/images/googlemaps/icon_lastpos.png';
                icons['_lastpos'].iconAnchor = point;
                icons['_lastpos'].iconSize = size;
                icons['_lastpos'].infoWindowAnchor = point;

		icons['moored'] = new GIcon();
                icons['moored'].image = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
                icons['moored'].iconAnchor = point;
                icons['moored'].iconSize = size;
                icons['moored'].infoWindowAnchor = point;

		icons['waiting'] = new GIcon();
                icons['waiting'].image = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
                icons['waiting'].iconAnchor = point;
                icons['waiting'].iconSize = size;
                icons['waiting'].infoWindowAnchor = point;
			
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
		  i//return;
		}
		
		//request.open("GET", params["file"] + ".xml", true);
		//request.open("GET", "owner_6277.xml", true);
		
		var jetzt = new Date();
		var ts = jetzt.getTime();
		
		request.open("GET", "http://www.vesseltracker.com/googleMapsServlet/owner_32917_allgroups_lp.xml?id=" + ts, true);
		request.onreadystatechange = function() {
			if (request.readyState == 4) {
				var xmlDoc = request.responseXML;
				var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
				marker = new Array(markerElements.length);
				info = new Array(markerElements.length);
				sidebar_html = "- ";
				
				


				for(var i = 0; i < markerElements.length; i++) {
					
					var pt;
					var lastSeenHtml="";
					if(markerElements[i].getAttribute("lat")!=null && markerElements[i].getAttribute("lng")!=null){
						pt = new GLatLng(parseFloat(markerElements[i].getAttribute("lat")), parseFloat(markerElements[i].getAttribute("lng")));
					}else if(markerElements[i].getAttribute("last_lat")!=null && markerElements[i].getAttribute("last_lon")!=null){
						pt = new GLatLng(parseFloat(markerElements[i].getAttribute("last_lat")), parseFloat(markerElements[i].getAttribute("last_lon")));
						lastSeenHtml="<tr><td><br />Keine aktuelle Position.</td></tr><tr><td>Letzte empfangene<br /> Position:</td></tr><tr><td>" + markerElements[i].getAttribute("last_seen") + "</td></tr>" ;
					}
					var icon = markerElements[i].getAttribute("icon");
					var name = markerElements[i].getAttribute("name");
					var shipImage;
					
					
					if (markerElements[i].getAttribute("imo") != null)
						{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-" + markerElements[i].getAttribute("imo") + ".html";
                                                shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=thumbnails&imo=' +    markerElements[i].getAttribute("imo");
						}
					else
						{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-I" + markerElements[i].getAttribute("id") + ".html";
                                                shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=thumbnails&shipId=' +    markerElements[i].getAttribute("id");
						}



					
					var info1 = '<div style="height:275px;width:250px;background-color:#FFFFFF;font-size:12px;font-family:verdana, sans-serif">';
					info1 += "<strong><a href=\"" + shipURL + "\" target=\"_blank\">" + name + "</a></strong><br>";
						if (markerElements[i].getAttribute("last") != null) { info1 += "letzte Sichtung: " + markerElements[i].getAttribute("last") + " "; }
						
					var info2 = "";
					var name_extension = "";
						info2 +='<table border="0" cellspacing="0" cellpadding="3" width="95%">';
						info2 += '<tr><td colspan="2"><img src="' + shipImage + '" alt="" /></td></tr>';
						if (markerElements[i].getAttribute("call") != null) { info2 += "<tr><td>Rufzeichen:</td><td>" +	markerElements[i].getAttribute("call") + "</td></tr>" ; }
						if (markerElements[i].getAttribute("speed") != null) { info2 += "<tr><td valign='top'>Geschw.</td><td>" +	markerElements[i].getAttribute("speed") + " kn (" + (Math.round(markerElements[i].getAttribute('speed')*1.852*10)/10) + "&nbsp;km/h)</td></tr>" ; }
						if (markerElements[i].getAttribute("cog") != null) { info2 += "<tr><td>Kurs</td><td>" + markerElements[i].getAttribute('cog') + "&deg;</td></tr>";}
						if (markerElements[i].getAttribute("imo") != null)
						{ 
							var imo = markerElements[i].getAttribute("imo");
							info2 += "<tr><td>IMO-Nr.</td><td>" +	imo + "</td></tr>" ; 
							
						}
						
						if (markerElements[i].getAttribute("length") != null) { info2 += "<tr><td>L&auml;nge:</td><td>" +	markerElements[i].getAttribute("length") + "m</td></tr>" ; }
						if (markerElements[i].getAttribute("width") != null) { info2 += "<tr><td>Breite:</td><td>" +	markerElements[i].getAttribute("width") + "m</td></tr>" ; }
						info2 += lastSeenHtml;
						info2 += "</table>";
						info2 += "</div>";
						sidebar_html += "<a style='color:#555555' href='javascript:opener(" + i + ")'>" + encodeShipname(name) + name_extension + "</a> - ";
						//info3 += endtag;
					
						//info[i] = info1 + "<br>" + info3;
					
						info[i] = info1 + "<br>" + info2;
					
					//var info1 =  "<br>" + name;
					//info[i] = info1;
					createMarker(pt, icons[icon], i);
					map.panTo(pt);
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
			var lat = 53.55; //params['lat'];
			var lon = 9.9; //params['lon'];
			var z = 7; //parseInt(params['z']);
			if (params['z'] != null)
			{
				z = parseInt(params['z']);
			}
			map = new GMap2(document.getElementById("map"));
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
