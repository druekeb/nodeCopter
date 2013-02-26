	var g_map;
	var g_marker;
	var g_info;
	var g_icons;
	var g_sidebar_html=""; // <-- don't remove the "" !
	var mode = 'default';
	
	var g_fillColorMoving = "#85B5E6";
	var g_fillColorMoored = "#FAB57A";
	var g_lineColorMoving = "#000000";
	var g_lineColorMoored  = "#000000";
	
	
	// short names of Ship owners the should not be rendered MixedCase
	var ABBREVS = new Array(
	 "CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
	 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
	 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
	 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
	 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
	 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
	 "II", "III", "IV", "VI", "VII"); // roemische zahlen
	 
	function getShipType(type)
	{
		switch(type)
		{
			case "tankships": return "Tanker";
			case "coast_guard_ships": return "Polizei / K&uuml;stenwache";
			case "tugboats": return "Schlepper";
			case "cargo_ships": return "Frachtschiff";
			case "others": return "Sonstige";
			case "pilot_vessels": return "Lotse";
			case "dredgers": return "Bagger";
			case "passenger_ships": return "Passagierschiff";
			case "sailing_vessels": return "Segelschiff";
			case "pleasure_crafts": return "Sportboot";
		}
		return type;
	}
	 
	 
	 
	
	function prepareIcons()
	{
		var point = new GPoint(10, 10);
		var size = new GSize(20, 20);
		var icons = new Array();
		for(var i = 1; i < 10; i++)
		{
			icons[i] = new GIcon();
			icons[i].image = "http://www.vesseltracker.com/images/googlemaps/icon"+i+".png";
			icons[i].iconAnchor = point;
			icons[i].iconSize = size;
			icons[i].infoWindowAnchor = point;
		}
		icons['moored'] = new GIcon();
		icons['moored'].image = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
		icons['moored'].iconAnchor = point;
		icons['moored'].iconSize = size;
		icons['moored'].infoWindowAnchor = point;
		
    	icons['anchorage'] = icons[5];
    	
    	icons['waiting'] = new GIcon();
    	icons['waiting'].image = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
    	icons['waiting'].iconAnchor = point;
		icons['waiting'].iconSize = size;
		icons['waiting'].infoWindowAnchor = point;
		return icons;
	}
	
	

function getVesselIcon(marker)
{
	var icon;
	var status = marker.getAttribute("status");
	var markerIcon = marker.getAttribute("icon");
	if (status == "MOORED")
	{
		icon =  'moored';
	}
	else if (status == "WAITING")
	{
		icon =   'waiting';
	}
	else if (status == "ANCHORAGE")
	{
		icon =   'anchorage';
	}
	else if (status == "MOVING")
	{
		icon =  markerIcon;
	} 
	else
	{
		icon = 'waiting';
	}
	return g_icons[icon];
}
	
	
	function opener(i)
	{
		g_marker[i].openInfoWindowHtml(g_info[i]);
	}
	
	
	function makeOpenerCaller(i)
	{
		return function()
		{
			opener(i);
		}
	}
	
	function createMarker(point, icon, i)
	{
		g_marker[i] = new GMarker(point, icon);
		GEvent.addListener(g_marker[i], 'click', makeOpenerCaller(i));
		g_map.addOverlay(g_marker[i]);
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
		var rets = name.toLowerCase();
		for (var i=0; i<ABBREVS.length; i++) 
		{
			var abbrev = ABBREVS[i].toLowerCase() + " ";
			var idx = rets.indexOf(abbrev);
			if (idx>=0 && (idx==0 || rets.charAt(idx-1)==' '))
			{
				rets = rets.replace(abbrev,ABBREVS[i]+" ");
			}
		}
		var retb = "";
		var sp = rets.split(" ");
		
		for (var i=0; i<sp.length; i++) 
		{
			if (sp[i].length==0) continue;
			if(i>0) retb += " ";
			retb = retb 
				+ sp[i].charAt(0).toUpperCase()
			    + sp[i].substr(1);
		}
		return retb;
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
	
	
	
	function readMap(icons) 
	{
		var request = GXmlHttp.create();
		var params = getUrlParams();
		
		if (params['file'] == null)
		{
			return;
		}
		
		if (params['file'] == 'abendblatt_hamburg')
		{
			request.open("GET", "http://www.vesseltracker.com/aisserver/googleMapsNew/abendblatt_hamburg.xml", true);
			mode = 'default';
		}
		else if (params['file'] == 'owner_30549')
		{
			request.open("GET", "http://www.vesseltracker.com/aisserver/googleMapsNew/owner_30549_default.xml", true);
			mode = 'special';
		}
		
		
		//debug
		//request.open("GET", "owner_6277.xml", true);
		
		//Schiffe von Owner
		//request.open("GET", "http://www.vesseltracker.com/aisserver/googleMapsNew/owner_5998.xml", true);
		//request.open("GET", "http://www.vesseltracker.com/aisserver/googleMapsNew/abendblatt_hamburg.xml", true);
		
		
		request.onreadystatechange = function()
		{
			if (request.readyState == 4)
			{
				var xmlDoc = request.responseXML;
				var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
				g_sidebar_html = "";
				g_marker = new Array(markerElements.length);
				g_info = new Array(markerElements.length);
				
				for(var i = 0; i < markerElements.length; i++)
				{
					var pt = new GLatLng(parseFloat(markerElements[i].getAttribute("lat")), parseFloat(markerElements[i].getAttribute("lng")));
					var fillColor = markerElements[i].getAttribute("status")=="MOVING"?g_fillColorMoving:g_fillColorMoored;
					var lineColor = markerElements[i].getAttribute("status")=="MOVING"?g_lineColorMoving:g_lineColorMoored;
					var poly = new GPolygon(createVesselPolygon(markerElements[i]),lineColor, 1, 1, fillColor, 0.5);
					var icon = getVesselIcon(markerElements[i]);
					var name = markerElements[i].getAttribute("name");
					if (markerElements[i].getAttribute("imo") != null)
					{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-" + markerElements[i].getAttribute("imo") + ".html";
					}
					else
					{
						shipURL = "http://www.vesseltracker.com/de/Ships/" + encodeShipnameForUrl(name) + "-I" + markerElements[i].getAttribute("id") + ".html";
					}
					
					var info1 = "<strong><a href=\"" + shipURL + "\" target=\"_blank\">" + encodeShipname(name) + "</a></strong><br>";
					info1 += "(" + getShipType(markerElements[i].getAttribute("t")) + ")<br/>";
					var info2 = "";
					var shipImage = "";
					if (markerElements[i].getAttribute("imo") != null)
					{
						shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=thumbnails&imo=' +    markerElements[i].getAttribute("imo");
					}
					else
					{
						shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=thumbnails&shipId=' +    markerElements[i].getAttribute("id");
					}
					info2 += '<div style="height:85px;width:111px;background-color:#FFFFFF;font-size:0.8em">';
					info2 += '<img src="'+shipImage+'" alt="Leider kein Bild verf&uuml;gbar"/>';
					info2 += '</div><br clear="all"/>';
					info2 += '<div style="font-size:0.8em">';
					info2 += '<table border="0" cellspacing="0" cellpadding="3">';
					if (markerElements[i].getAttribute("length") != null) { info2 += "<tr><td>L&auml;nge:</td><td>" +	markerElements[i].getAttribute("length") + " m</td></tr>" ; }
					if (markerElements[i].getAttribute("width") != null) { info2 += "<tr><td>Breite:</td><td>" +	markerElements[i].getAttribute("width") + " m</td></tr>" ; }
					if (markerElements[i].getAttribute("country") != null)
					{
						info2 += "<tr><td valign='top'>Flagge:</td><td>";
						info2 += '<img src="http://images.vesseltracker.com/images/flags/'+markerElements[i].getAttribute("flag")+'.png" alt=""/> ';
						info2 += markerElements[i].getAttribute("country");
						info2 += "</td></tr>";
						
					}
					info2 += "</div>";
					g_info[i] = info1 + "<br>" + info2;
					g_sidebar_html += "<a style='color:#555555' href='javascript:opener(" + i + ")'>" + encodeShipname(name) + "</a><br/>";
					var elemSidebar = document.getElementById("sidebar");
					elemSidebar.innerHTML = g_sidebar_html;
					g_map.addOverlay(poly);
					createMarker(pt, icon, i);
				}
			}
		}
		request.send(null);
	}
		
	function reloadMap()
	{
		g_map.clearOverlays(),
		readMap(g_icons);
		
		if (mode == 'special')
		{
			window.setTimeout("reloadMap()",60000);
		}
		else
		{
			window.setTimeout("reloadMap()",600000);
		}
	}
	
	function onLoad()
	{
		if (GBrowserIsCompatible())
		{
			g_icons = prepareIcons();
			var params = getUrlParams();
			var lat = params['lat'];
			var lon = params['lon'];
			var z = parseInt(params['z']);
			g_map = new GMap2(document.getElementById("map"),{mapTypes: [G_MAP_TYPE,G_SATELLITE_TYPE]});
			g_map.addControl(new GLargeMapControl());
			g_map.addControl(new GMapTypeControl());
			g_map.setCenter(new GLatLng(53.539, 9.995), 11);
			g_map.enableScrollWheelZoom();
			if (mode == 'special')
			{
				window.setTimeout("reloadMap()",60000);
			}
			else
			{
				window.setTimeout("reloadMap()",600000);
			}
			readMap(g_icons);
		}
		else
		{
			alert("Your browser is not compatible with Google Maps. Please use the Internet Explorer 7 or Mozilla Firefox.");
		}
		
		var elemDescription = document.getElementById("description");
		if (mode == 'special')
		{
			elemDescription.innerHTML = "Auf der Karte wird die aktuelle Position der Schiffe angezeigt.";
		}
		else
		{
			elemDescription.innerHTML = "Die Positionen werden mit einer Verzögerung von ca. einer Stunde dargestellt.";
		}
	}
	
	
	function deg2rad(grad) {return  grad * Math.PI/180.0;}


	function calcPoint(lon, lat, dx, dy, sin_angle, cos_angle)
	{
		var dy_deg = -((dx*sin_angle + dy*cos_angle)/(1852.0))/60.0;
		var dx_deg = -(((dx*cos_angle - dy*sin_angle)/(1852.0))/60.0)/Math.cos(deg2rad(lat));
		return new GLatLng(lat-dy_deg,lon-dx_deg);
	}
	
	
	function createVesselPolygon(marker)
	{
		var hdg = marker.getAttribute("th");
		var cog = marker.getAttribute("cog");
		var left = marker.getAttribute("left");
		var front = marker.getAttribute("front");
		var len = marker.getAttribute("length");
		var lon = marker.getAttribute("lng");
		var lat = marker.getAttribute("lat");
		var wid = marker.getAttribute("width");
		var angle_rad;
		if(!hdg || hdg==0.0)
		{
			angle_rad = deg2rad(-cog);
		}
		else
		{
			angle_rad = deg2rad(-hdg);
		}
		var cos_angle=Math.cos(angle_rad);
		var sin_angle=Math.sin(angle_rad);
		var shippoints = new Array();
	
		//front left
		var dx = -left;
		var dy = front-(len/10.0);	
	    shippoints.push(calcPoint(lon,lat, dx, dy,sin_angle,cos_angle));
	    
	    //rear left
	    dx = -left;
	    dy = -(len-front);
		shippoints.push(calcPoint(lon,lat, dx,dy,sin_angle,cos_angle));
		
		//rear right
	    dx =  wid - left;
	    dy = -(len-front);
		shippoints.push(calcPoint(lon,lat, dx,dy,sin_angle,cos_angle));
		
		//front right
		dx = wid - left;
		dy = front-(len/10.0);
		shippoints.push(calcPoint(lon,lat,dx,dy,sin_angle,cos_angle));	
	    
	    //front center
		dx = wid/2.0-left;
		dy = front;
		shippoints.push(calcPoint(lon,lat,dx,dy,sin_angle,cos_angle));
		
		shippoints.push(shippoints[0]);
		return shippoints;
	}
