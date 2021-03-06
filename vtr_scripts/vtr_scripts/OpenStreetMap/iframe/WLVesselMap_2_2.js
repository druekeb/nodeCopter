if (typeof window.loadFirebugConsole == "undefined" || typeof window.console == 'undefined' ) {
  var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
  window.console = {};
  for (var i = 0; i < names.length; ++i) {
    window.console[names[i]] = function(){};
  }
}

function VtMap(mapdiv, infoboxdiv, sidebardiv, vname) {
	
	var me = this;
	var varname = vname;
	var divname_map = mapdiv;
	var map;
	var requestURL;
	var requestInterval;
	var divname_sidebar = sidebardiv;
	var divname_infobox = infoboxdiv;
	var projwgs84 = new OpenLayers.Projection("EPSG:4326"); // WGS84 (Lon, Lat)
	var projmerc = new OpenLayers.Projection("EPSG:900913"); // Mercator (m)
	var firstload = true;
	var autozoom = true;
	var detailedInfo = true; 
	var refreshURL;
	var zoomLevel;
	var moveEndEvent;
	
	var iconLayer;
	var specialIconLayer;
	var clusterLayer;
	var clusterMode;
	var sidebar_html;
	var vesselinfoJson;
	var lastReload = 0;
	var currentMarkerShipId;
	var GL_CurrentImo;
	var lastReloadBounds = null;
	var highLightImo;
	var panToAfterLoad;

/**
	 *Initialisation of the map
	 */
	this.init = function()
	{
		 map = new OpenLayers.Map(divname_map, {
			controls : [],
			maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,
					20037508.34, 20037508.34),
			numZoomLevels : 18,
			maxResolution : 156543,
			units : 'm',
			projection : projmerc,
			displayProjection : projwgs84
			});
		 if (divname_map == "gatshipMap"){
			 autozoom = false;
			 map.events.on({"moveend": changePosition});
		 }
		 else if (divname_map == "WLregionmap"||moveEndEvent){
			 autozoom = false;
			map.events.on({"moveend":reloadURL});
		 }
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
		OpenLayers.Util.onImageLoadErrorColor = "transparent";
	    
		var urlArray = [
						"http://t1.tiles.vesseltracker.com/vesseltracker/",
						"http://t2.tiles.vesseltracker.com/vesseltracker/",
						"http://t3.tiles.vesseltracker.com/vesseltracker/" ];
		
		var mapLayer = new OpenLayers.Layer.TMS("mapLayer", urlArray,{
			displayOutsideMaxExtent: true,
			wrapDateLine: true,
	      	transitionEffect : 'resize',  
			numZoomLevels: 19, 
	        type: 'png', 
	        getURL: getTileURL, 
	        attribution: 'Map-Data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-By-SA</a> by <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors'
	     });		
		
		mapLayer.attribution = "Map-" + mapLayer.attribution;
		specialIconLayer = new OpenLayers.Layer.Markers("specialIconLayer");
		iconLayer = new OpenLayers.Layer.Markers("iconLayer");
		clusterLayer = new OpenLayers.Layer.Vector("clusterLayer");
		
		map.addLayers( [ mapLayer, clusterLayer, iconLayer,specialIconLayer]);
	}
	
	function getTileURL(bounds) 
	{
	  var res = this.map.getResolution();
	  var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
	  var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
	  var z = this.map.getZoom();
	  var limit = Math.pow(2, z);
	  if (y < 0 || y >= limit) 
	  {
	    return null;
	  }
	  else 
	  {
	    x = ((x % limit) + limit) % limit;
	    url = this.url;
	    path= z + "/" + x + "/" + y + "." + this.type;
	    if (url instanceof Array) 
	    {
	      url = this.selectUrl(path, url);
	    }
	    return url+path;
	  }
	}
	
	this.getBounds = function() {
		return map.getExtent().transform(projmerc,projwgs84);
	}
	
	this.setRefreshUrl = function(refreshUrl){
		refreshURL = refreshUrl;
		window.setTimeout(reloadURLTime,60000);
		}
	
	this.setMoveEndEvent = function(moveOn)
	{
		moveEndEvent = moveOn;
	}
	
	this.setAutoZoom = function(zoomAuto)
	{
		autoZoom = zoomAuto;
	}
	
	this.setHighLightImo = function(imo)
	{
		highLightImo = imo;
	}
	
	this.addVesselsCustomer = function(vesselinfo, lat, lon,zoom)
	{
		vesselinfoJson = vesselinfo;
		sidebar_html = "";
		clusterLayer.destroyFeatures();
		if (iconLayer.markers != null) 
		{
			while (iconLayer.markers.length > 0) {
				iconLayer.markers[0].destroy();
				iconLayer.removeMarker(iconLayer.markers[0]);
			}
		}
		specialIconLayer.clearMarkers();
		for (var i = 0; i < vesselinfoJson.length; i++)
		{
			var imo = vesselinfoJson[i].imo;
			var encodedName = encodeShipname(vesselinfoJson[i].name);
			var shipId = vesselinfoJson[i].shipId;
			var lonlat = getLonLat(vesselinfoJson[i]).transform(projwgs84,projmerc);
			var icon  = getVesselIcon(vesselinfoJson[i]);
			addMouseOverMarker(i, lonlat, "http://images.vesseltracker.com/images/googlemaps/icon" + icon + ".png", 20);
			if (imo ==  highLightImo )
			{
				addMouseOverMarker(i, lonlat, "http://images.vesseltracker.com/images/googlemaps/circle_red.png",26);
			}			
			var vtUrl;
			if (imo) {vtUrl = "http://www.vesseltracker.com/de/Ships/"+ encodedName + "-" + imo + ".html";}
			else { vtUrl = "http://www.vesseltracker.com/de/Ships/"+ encodedName +"-I" + shipId + ".html";}
		    
			if (document.URL.indexOf("smd.de") == 0) 
			{
				sidebar_html += "<a style='color:#555555' href='javascript:"+varname+".opener("+ i + ", " + true + ")' ondblclick='window.open(\"" + vtUrl + "\")'>" + encodedName + "</a><br/>";		
			}
			else
			{
				if (imo ==  highLightImo )
				{
					sidebar_html += "<a style='color:#555555' href='javascript:"+varname+".opener("+ i + ","+ true + ")'><b style='color:green'>" + encodedName + "</b></a><br/>";
					panToAfterLoad = i;
				}
				else
				{
					sidebar_html += "<a style='color:#555555' href='javascript:"+varname+".opener("+ i + ","+ true + ")'>" + encodedName + "</a><br/>";
				}
			 } 
			if (shipId && shipId == currentMarkerShipId)
			{
				var specialMarker = new OpenLayers.Marker(lonlat, new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(22, 22)));
				specialIconLayer.addMarker(specialMarker);
			}
			
		}	
		if (autozoom) //German Lloyd feature
		{
			if(GL_CurrentImo == imo)
			{
				var specialMarker = new OpenLayers.Marker(lonlat.transform(projwgs84,projmerc), new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(22, 22)));
				specialIconLayer.addMarker(specialMarker);
			}
			if (vesselinfoJson.length > 1)
			{
				//nicht zoomen bei Refresh
				if (firstload)
				{
					firstload = false;
					if (lat)
					{
						me.setCenter(lon,lat,zoom);
					}
					else //nur parameter vesselinfo ist gesetzt
					{
						map.zoomToExtent(iconLayer.getDataExtent());
					}
				}
			}
			//wird nur ein Schiff übergeben, darauf zoomen
			else if (vesselinfoJson.length == 1)
			{
				var zoom = 8; //zoomLevel for German Lloyd
				if (zoomLevel) //set by gatship.js 
				{
					zoom = zoomLevel;
				}	
				if (vesselinfoJson[0].lat) 
				{
					me.setCenter(vesselinfoJson[0].lon, vesselinfoJson[0].lat,zoom);
				}
				else
				{
					me.setCenter(vesselinfoJson[0].lastlon, vesselinfoJson[0].lastlat,zoom);
				}
				this.opener(0,false);
			}
			else //wird kein Schiff übergeben, zeige die gesamte Weltkarte
			{
				me.setCenter(0,0,2);
			}
		}
		document.getElementById(divname_sidebar).innerHTML = sidebar_html;
	}
	
	
//	Create Clusterfeatures and give them a "type" attribute for their size and a label attribute for display their ship-count
	
	this.drawClusters = function(jSONData)
	{
		clusterMode = true;
		clusters = new Array(jSONData.length);
		clusterLayer.destroyFeatures();
		specialIconLayer.clearMarkers();
		/* remove and destroy all markers from the icon layer (memory leak?) */
		if (iconLayer.markers != null) 
		{
			while (iconLayer.markers.length > 0) {
				iconLayer.markers[0].destroy();
				iconLayer.removeMarker(iconLayer.markers[0]);
			}
		}
		
		for (var i = 0; i < jSONData.length; i++) {
			var lat = jSONData[i].lat;
			var lon = jSONData[i].lon;
			var count = jSONData[i].count;
	            clusters[i] = new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(lon, lat)).transform(projwgs84,projmerc), {type: 15+ parseInt((Math.pow(Math.log(count),1.5))), label:count});
		}		
		// create a layer styleMap with a symbolizer template for the trackingAndClusteringLayer
		clusterLayer.styleMap = new OpenLayers.StyleMap(
				{
					pointRadius: "${type}", // based on feature.attributes.type
					fillColor: "#661111",
//          		fillOpacity:"0.8",	//funktioniert nicht in IE
					label:"${label}", //based on feature.attributes.label
					fontWeight:"bold",
					fontSize:"0.9em",
					fontColor:"white",
					externalGraphic: "http://images.vesseltracker.com/images/osm/blur.png"//"cloud.png" 
				});
        clusterLayer.addFeatures(clusters);
        document.getElementById(divname_sidebar).innerHTML = "";
        document.getElementById(divname_infobox).innerHTML = "";
	}
	
	this.loadVesselXML = function(xmlFile, refresh_interval){
		requestURL = xmlFile;
		if(refresh_interval)
		{
			requestInterval = refresh_interval;
			doLoadXmlTime();
		}
		else
		{
			doLoadXml();
		}
	}

	function doLoadXmlTime()
	{
		window.setTimeout(doLoadXmlTime,requestInterval);
		doLoadXml();
	}
		
	function doLoadXml()
	{
		var request = OpenLayers.Request.GET({url: requestURL + "?id=" + new Date().getTime(), callback: refreshMap});
		lastReload = new Date().getTime();
	}
	
 	this.zoomOut = function(){
		map.zoomOut();
	}
 	
 	this.setZoomLevel = function(z) //introduced for gatship
 	{
 		if (z > 18)
 		{
 			z = 18;
 		}
		zoomLevel = z;
	}

	this.zoomIn = function(){
		map.zoomIn();
	}
	
	this.addControl = function(c_name)
	{
		var control = getControlByName(c_name);
		map.addControl(control);
	}
	this.setDetailedInfo = function(trueorfalse)
	{
		detailedInfo = trueorfalse;
	}
	
	
	/**
	 * @param i index of ship in array vessels
	 * @param p indicates if to pan(center map) to ship (p > 0) or not
	*/
	
	this.opener = function (i, pan) {
		if(i < 0)
		{
			i = panToAfterLoad;
		}
		if(typeof i != "undefined")
		{
			var lonlat = getLonLat(vesselinfoJson[i]);
			var vtUrl;
			var imo = vesselinfoJson[i].imo;
	        var shipId = vesselinfoJson[i].shipId;
			specialIconLayer.clearMarkers();
			
	        var encodedName = encodeShipnameForUrl(vesselinfoJson[i].name);
	        if (imo) {vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName + "-" + imo + ".html";}
			else { vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-I" + shipId + ".html";}
	        
	        var specialMarker = new OpenLayers.Marker(lonlat.transform(projwgs84, projmerc),
							new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(22, 22)));
				
			var dclick = function (ev)
			{
				window.open(vtUrl);
			}
			if (divname_map != "WLregionmap")
			{	
				if (specialMarker.events)
				{
					specialMarker.events.remove("dblclick");
				}
				if (document.URL.indexOf("smd.de") == 0)
				{
					specialMarker.events.register("dblclick",undefined,dclick);
				}
			}
			specialIconLayer.addMarker(specialMarker);
			currentMarkerShipId = shipId;
			GL_CurrentImo = imo;
			
			if(detailedInfo)
			{
				showInfoCustomer(i);
			}
			else
			{
				showInfoSmall(i);
			}
			
			if(pan)
			{
				map.panTo(getLonLat(vesselinfoJson[i]).transform(projwgs84,projmerc));
			}
		}	
	}
		
	 
	 function getLonLat (vessel){
			if (vessel.lat) 
			{
				return new OpenLayers.LonLat(vessel.lon, vessel.lat);
			}
		else
			{
				return new OpenLayers.LonLat(vessel.lastlon, vessel.lastlat);
			}
		}
		

	function addMouseOverMarker (id, lonlat, iconUrl, size) 
	{
		var icon = new OpenLayers.Icon(iconUrl, new OpenLayers.Size(size, size));
		var marker = new OpenLayers.Marker(lonlat, icon);
			
		var marker_mouseover = function (ev)
		{
			me.opener(id,false);
		};
		marker.events.register("mouseover", marker, marker_mouseover); 
		iconLayer.addMarker(marker);
		return marker;
	}
		
 	function reloadURLTime()
	{
 		window.setTimeout(reloadURLTime,60000);
		reloadURL();
	}		
	
	function reloadURL(){
		var bounds = map.getExtent().transform(projmerc,projwgs84);
		var request = OpenLayers.Request.GET({url: refreshURL , params:{top: bounds.top, left: bounds.left, bottom: bounds.bottom, right: bounds.right}, callback: refreshMapJSon});
	}
	
	function refreshMapJSon(myJSONtext){
			var jSONData = eval( myJSONtext.responseText);
			
			if (jSONData.length >= 1)
			{
				//elemente der ersten antwort auslesen und entscheiden ob schiffe malen oder clustern
				
				if (jSONData[0].count)
				{
					me.drawClusters(jSONData);
				}
				else
				{
					me.addVesselsCustomer(jSONData);
				}
			}
		}
			
	function refreshMap (request)
	{
		var xmlDoc = request.responseXML;
		var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
		var vesselinfo = new Array();
	
		for(var i = 0; i < markerElements.length; i++)
		{
			var vessel = new Object();
			vessel.status = markerElements[i].getAttribute("status");
			vessel.name = markerElements[i].getAttribute("name");
			vessel.icon = markerElements[i].getAttribute("icon");
			vessel.imo = markerElements[i].getAttribute("imo");
			vessel.mmsi = markerElements[i].getAttribute("mmsi");
			vessel.call = markerElements[i].getAttribute("call");
			vessel.type = markerElements[i].getAttribute("t");
			vessel.lat = markerElements[i].getAttribute("lat");
			vessel.lon = markerElements[i].getAttribute("lng");
			vessel.lastlat = markerElements[i].getAttribute("last_lat");
			vessel.lastlon = markerElements[i].getAttribute("last_lon");
			vessel.heading = markerElements[i].getAttribute("th");
			vessel.shipId = markerElements[i].getAttribute("id");
			vessel.course = markerElements[i].getAttribute("cog");
			vessel.width = markerElements[i].getAttribute("width");
			vessel.length = markerElements[i].getAttribute("length");
			vessel.left = markerElements[i].getAttribute("left");
			vessel.front = markerElements[i].getAttribute("front");
			vessel.nationality = markerElements[i].getAttribute("country");
			vessel.flagid = markerElements[i].getAttribute("flag");
			vessel.speed = markerElements[i].getAttribute("speed");
			vessel.pic = markerElements[i].getAttribute("p");
			vessel.lastSeen = markerElements[i].getAttribute("last_seen");
	
			vesselinfo.push(vessel);
				}
			me.addVesselsCustomer(vesselinfo);
		}
	
	/**
	 * Centers the map to lon,lat,zoom (WGS84)
	 */
	this.setCenter = function(lon, lat, zoom) {
		var ll = new OpenLayers.LonLat(lon, lat).transform(projwgs84, projmerc);
		map.setCenter(ll,zoom);
	}	
	
	function formatLat(lat)
	{
		var ret;
		if(lat<0)
		{
			lat = -lat;
			ret ='S ';
		}
		else
		{
			ret ='N ';
		}
		var deg = Math.floor(lat);
		ret += padDigits(deg,2)+"° ";
		var min = ((lat-deg)*60.0);
		var minF = Math.floor(min);
		
		var sec = ((min - minF) * 60.0).toFixed(2);
		if (sec == 60.00)
		{
			sec = 0.0;
			sec = sec.toFixed(2);
			minF += 1;
		}		
		ret += padDigits(minF, 2) + "' ";
		ret += padDigits(sec, 5) + "\" ";
		return ret;
	}

	
	function padDigits(n, totalDigits) 
	{ 
		n = n.toString(); 
		var pd = '';
		if (totalDigits > n.length) 
		{ 
			for (var i=0; i < (totalDigits-n.length); i++) 
			{ 
					pd += '0'; 
			} 
		} 
		return pd + n;
	} 

	function formatLon(lon)
	{
		var ret;
		if(lon<0)
		{
			lon=-lon;
			ret='W ';
		}
		else
		{
			ret='E ';
		}
		
		var deg = Math.floor(lon);
		ret += padDigits(deg, 3) + "° ";
		var min = ((lon - deg) * 60.0);
		var minF = Math.floor(min);
		var sec = ((min - minF) * 60.0).toFixed(2);
		if (sec == 60.00)
		{
			sec = 0.0;
			sec = sec.toFixed(2);
			minF += 1;
		}
		ret += padDigits(minF, 2) + "' " + padDigits(sec, 5) + "\"";
		return ret;
		
	}

	
	function showInfoCustomer(i) {
		
		var vtUrl = "";
		var imo = vesselinfoJson[i].imo;
		var shipId = vesselinfoJson[i].shipId;
		var encodedName = encodeShipnameForUrl(vesselinfoJson[i].name);
		var lonlat = getLonLat(vesselinfoJson[i]);
		
		if (imo)
		{
			vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-" + imo + ".html";
		}
		else
		{
			vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-I" + shipId + ".html";
		}
		
		var infoHtml = "<table border='0' cellspacing='0' width='100%' height='80' cellpadding='3'>";

		var photoId = vesselinfoJson[i].pic;
		var flagId = vesselinfoJson[i].flagid;

		infoHtml += "<tr>";
		if (document.URL.indexOf("smd.de") == 0)
		{
			infoHtml += "<td width='15%' rowspan='4'><a href='"+vtUrl+"' target='_blank'>";
		}
		else
		{
			infoHtml += "<td width='15%' rowspan='4'>";
		}
		if (!photoId)
		{
			infoHtml += "no picture";
		
		} else {
			infoHtml += "<img  border='0' src='http://images.vesseltracker.com/images/vessels/thumbnails/" + photoId +".jpg'/>";
		}
		
		infoHtml += "</a></td>";
	
	
		infoHtml += "<td colspan='2' width='20%'><b>" + encodeShipname(vesselinfoJson[i].name) + "</b></td>";

		infoHtml += "<td width='7%'>Flag:</td><td width='13%'>";
		if (vesselinfoJson[i].nationality) {infoHtml += vesselinfoJson[i].nationality;}
		infoHtml += "&nbsp;</td>";
		
		var status = vesselinfoJson[i].status;
		if (status){ infoHtml += "<td width = '7%'>Status:</td><td width = '15%'>" + status+ "</td>" }	
		else {infoHtml += "<td width = '7%'></td><td width = '15%'></td>";}

		infoHtml += "<td width='7%'>"+(vesselinfoJson[i].lastSeen?"Last Seen:":"")+"</td><td width='16%'>"+ (vesselinfoJson[i].lastSeen?vesselinfoJson[i].lastSeen:"") + "</td></tr>";
		
		infoHtml += "<tr>";
		infoHtml += "<td>IMO No.:</td><td>";
		
		if (vesselinfoJson[i].imo) { infoHtml +=  vesselinfoJson[i].imo;}
		infoHtml +=  "&nbsp;</td>";
		
		infoHtml += "<td>Length:</td><td>";
		if (vesselinfoJson[i].length) {infoHtml += vesselinfoJson[i].length + " m";}
		infoHtml += "</td>";
		infoHtml += "<td width='7%'>"
		
		if (status == "MOORED"){	infoHtml += (vesselinfoJson[i].port?"Port:":""); }
		else 	{	infoHtml += (vesselinfoJson[i].destination?"Destination:":"");	}
		
		infoHtml += "</td><td width='13%'>";
		
		if (status == "MOORED"){ infoHtml += (vesselinfoJson[i].port?vesselinfoJson[i].port:"")}
		else 	{  infoHtml += (vesselinfoJson[i].destination?vesselinfoJson[i].destination:"");  }
		
		infoHtml += "&nbsp;</td><td>";
		infoHtml += "Lat:</td><td>"+ formatLat(lonlat.lat) + "</td></tr>"; 
	
		infoHtml += "<tr><td>Callsign:</td><td>";
		if (vesselinfoJson[i].call && !(vesselinfoJson[i].call == "null")) {infoHtml += vesselinfoJson[i].call;}
		infoHtml += "&nbsp;</td>";
		infoHtml += "<td>Beam:</td><td>";
		if (vesselinfoJson[i].width) { infoHtml +=  vesselinfoJson[i].width + " m";}
		infoHtml+= "&nbsp;</td><td>";
		
		if (status == "MOORED"){ infoHtml += (vesselinfoJson[i].berth?"Berth:":"") + "</td><td>"  + (vesselinfoJson[i].berth?vesselinfoJson[i].berth:""); }
		else if (status == "ANCHORAGE")	{
			infoHtml += (vesselinfoJson[i].anchorageArea?"Anchorage:":"") + "</td><td> " + (vesselinfoJson[i].anchorageArea?vesselinfoJson[i].anchorageArea:"");
			} 
		else {
			infoHtml += (vesselinfoJson[i].speed?"Speed:":"") + "</td><td>" + (vesselinfoJson[i].speed?vesselinfoJson[i].speed + " kn":"") ;
			}

		infoHtml += "</td><td>";
		
		infoHtml += "Lon:</td><td>" + formatLon(lonlat.lon)  + "</td></tr>";

		infoHtml += "<tr><td>MMSI:</td><td>"+ vesselinfoJson[i].mmsi+ "</td>";
		infoHtml += "<td>" + (vesselinfoJson[i].draught?"Draught:":"") + "</td><td>";
		if (vesselinfoJson[i].draught) { infoHtml += (vesselinfoJson[i].draught?vesselinfoJson[i].draught+ " m":"") ;}
		infoHtml +=   "&nbsp;</td>";
			
		if(status == "MOORED") { 		infoHtml += "<td>" + (vesselinfoJson[i].time_moored?"Moored:": "") + "</td><td>" + (vesselinfoJson[i].time_moored? vesselinfoJson[i].time_moored : "");}
		else if (status == "ANCHORAGE")    
		{
			infoHtml += "<td>" + (vesselinfoJson[i].time_anchored?"Anchored:":"") + "</td><td>" + (vesselinfoJson[i].time_anchored?vesselinfoJson[i].time_anchored:"");
		}  
		else
		{ 
			infoHtml += (vesselinfoJson[i].course?"<td>Course: </td><td>" + vesselinfoJson[i].course + "° ":"<td></td><td>");
		}

		infoHtml += "</td><td>";
		infoHtml += (vesselinfoJson[i].eta?"Eta: </td><td>" + vesselinfoJson[i].eta + "</td></tr></table>":"</td><td></td></tr></table>");
		infoHtml += "<br clear='all'><div style='font-size:10px;width:100%;text-align:right'>powered by vesseltracker.com</div>";
		
		document.getElementById(divname_infobox).innerHTML = infoHtml;
	}

	function showInfoSmall(i) {
		
		var vtUrl = "";
		var imo = vesselinfoJson[i].imo;
		var shipId = vesselinfoJson[i].shipId;
		var encodedName = encodeShipnameForUrl(vesselinfoJson[i].name);
		if (imo)
		{
			vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-" + imo + ".html";
		}
		else
		{
			vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-I" + shipId + ".html";
		}
		
		var infoHtml = "<table border='0' cellspacing='0' width='100%' height='80' cellpadding='3'>";
	
		var photoId = vesselinfoJson[i].pic;
	
		infoHtml += "<tr>";
		infoHtml += "<td width='25%' rowspan='4'><a href='"+vtUrl+"' target='_blank'>";
		if (!photoId)
		{
			infoHtml += "no picture";
		
		} else 
		{
			infoHtml += "<img  border='0' height='80' src='http://images.vesseltracker.com/images/vessels/thumbnails/" + photoId +".jpg'/>";
		}
		
		infoHtml += "</a></td>";
		infoHtml += "<td width='20%'>Name:</td><td width='20%'><b>"+ encodeShipname(vesselinfoJson[i].name) + "</b></td>";
		infoHtml += "<td width='15%'>L x B :</td><td width='20%'>" + vesselinfoJson[i].length + " m x " + vesselinfoJson[i].width + " m";
		infoHtml +=  "&nbsp;</td></tr>";
		
		infoHtml += "<tr><td>MMSI:</td><td>"+ vesselinfoJson[i].mmsi+ "</td><td>";
		var status = vesselinfoJson[i].status;
		if (status){ infoHtml += "Status:</td><td>" + status+ "</td><td>" }	
		else {infoHtml += "</td><td></td><td>";}
	
		infoHtml += "</tr><tr><td>Callsign:</td><td>"
		if (vesselinfoJson[i].call && !(vesselinfoJson[i].call == "null")) {infoHtml += vesselinfoJson[i].call;}
		infoHtml += "&nbsp;</td><td>";
		if(status == "MOVING"){
			infoHtml += "Speed:</td><td>" + (vesselinfoJson[i].speed?vesselinfoJson[i].speed + " kn</td></tr>":"</td><td></td></tr>") ;
		}
		else
		{
			infoHtml += "<td><td></td></tr>" ;
		}
		infoHtml += "<tr><td>" + (imo?"Imo No.:</td><td>" + imo :"</td><td>") +"</td><td>";
		if (status == "MOVING")
			{
				infoHtml += (vesselinfoJson[i].course?"Course:</td><td>" + vesselinfoJson[i].course + "°":"</td><td>") + "</td></tr></table>" ;
			}	
		else 
			{
				infoHtml += "</td><td></td></tr></table>";
			}
		document.getElementById(divname_infobox).innerHTML = infoHtml;
	}

	
	function getControlByName(c_name) 
	{
		if (c_name == "KeyboardDefaults")	return new OpenLayers.Control.KeyboardDefaults();
		if (c_name == "MouseDefaults")	return new OpenLayers.Control.MouseDefaults();
		if (c_name == "Navigation")		return new OpenLayers.Control.Navigation({ zoomWheelEnabled: false });
		if (c_name == "NavigationPlusMouseWheel")	return new OpenLayers.Control.Navigation();
		if (c_name == "LayerSwitcher")	return new OpenLayers.Control.LayerSwitcher();
		if (c_name == "PanZoomBar")		return new OpenLayers.Control.PanZoomBar();
		if (c_name == "MousePosition")	return new OpenLayers.Control.MousePosition();
		if (c_name == "ScaleLine")		return new OpenLayers.Control.ScaleLine();
		if (c_name == "Attribution")	return new OpenLayers.Control.Attribution();
		if (c_name == "PanZoom")	return new OpenLayers.Control.PanZoom();
		
	}
	 
	
	// short names of Ship owners the should not be rendered MixedCase
	var ABBREVS = new Array(
		 "MV.","CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
		 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
		 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
		 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
		 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
		 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
		 "II", "III", "IV", "VI", "VII"); // roemische zahlen

	
	 function encodeShipname(name)
	 {
	 	var rets = name.toLowerCase();
	 	rets = rets.replace(".",". ");
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

	 function encodeShipnameForUrl(name)
	 {
	 	var tokens = name.split(" ");
	 	var size = tokens.length;
	 	if(size>0)
	 		ret = tokens[0];
	 	for(j=1; j<size; j++)
	 	{
	 		ret += "-";
	 		ret += tokens[j];
	 	}
	 	return ret;
	 }


	function getVesselIcon(vessel)
	{
		var icon;
		if (vessel.lastlon)
		{
			icon = '_lastpos'
		}
		else if (vessel.status == "MOORED")
		{
			icon = '_moored';
		}
		else if (vessel.status == "WAITING")
		{
			icon = '_waiting';
		}
		else if (vessel.status == "ANCHORAGE")
		{
			icon = 5;
		}
		else if (vessel.status == "MOVING")
		{
			var dir = 0;
			if(vessel.course)
				dir = vessel.course;
			else if(vessel.heading)
				dir = vessel.heading;
			if( (dir<22.5) || (dir>=337.5) )
			{
				icon = 8;
			}
			else if(dir<67.5)
			{
				icon = 9;
			}
			else if(dir<112.5)
			{
				icon = 6;
			}
			else if(dir<157.5)
			{
				icon = 3;
			}
			else if(dir<202.5)
			{
				icon = 2;
			}
			else if(dir<247.5)
			{
				icon = 1;
			}
			else if(dir<292.5)
			{
				icon = 4;
			}
			else if(dir<337.5)
			{
				icon = 7;
			}
			else
			{
				icon = 5;
			}
		} 
		else
		{
			icon = '_waiting';
		}
		return icon;
	}
}
