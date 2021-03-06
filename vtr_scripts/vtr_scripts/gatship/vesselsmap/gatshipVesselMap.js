if (typeof window.loadFirebugConsole == "undefined" || typeof window.console == 'undefined' ) {
  var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
  window.console = {};
  for (var i = 0; i < names.length; ++i) {
    window.console[names[i]] = function(){};
  }
}
/*
 * Diese Klasse ist eine Einzellösung für gatship, abgeleitet von der generellen Lösung WLVesselMap.js
 * */

function VtMap(mapdiv, infoboxdiv, sidebardiv, vname) {
	
	var me = this;
	var varname = vname;
	var divname_map = mapdiv;
	var map;
	var ownerURL;
	var divname_sidebar = sidebardiv;
	var divname_infobox = infoboxdiv;
	var projwgs84 = new OpenLayers.Projection("EPSG:4326"); // WGS84 (Lon, Lat)
	var projmerc = new OpenLayers.Projection("EPSG:900913"); // Mercator (m)
	var firstload = true;
	var requestURL;
	var zoomLevel;
	var zoomArea;
	var xmlDoc;
	var markerElements;
	var vessels;
	var iconURL = "http://images.vesseltracker.com/images/circleblue.png";
	var iconSize = 22; //size of specialIcon (ring for highlighting a ship at mouseover)
	
	var iconLayer;
	var sidebar_html;
	var vesselinfoJson;
	var refreshedVessels = new Array();
	var lastReload = 0;
	var groupIcon;
	var specialMarker;
	var currentMarker = -1;
	var lastReloadBounds = null;


/***Initialisation of the map	 */
	
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
			 map.events.on({"moveend": changePosition});
			 OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
			 OpenLayers.Util.onImageLoadErrorColor = "transparent";
			 
			 var urlArray = [
				"http://t1.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png",
 				"http://t2.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png",
				"http://t3.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png" 
 				];
		
			 var mapLayer = new OpenLayers.Layer.OSM("mapLayer", urlArray, {	transitionEffect : 'resize'});
			 mapLayer.attribution = "Map-" + mapLayer.attribution;
			 iconLayer = new OpenLayers.Layer.Markers("iconLayer");
			 map.addLayers( [ mapLayer, iconLayer ]);
		};
	
	this.addVesselsCustomer = function(vesselinfo){
		vesselinfoJson = vesselinfo;
		sidebar_html = "";
	
		/* remove and destroy all markers */
		var marker;
		while( iconLayer.markers.length ) {
			marker = iconLayer.markers[0];
			iconLayer.removeMarker(iconLayer.markers[0]);
			marker.destroy();
		}
		
	for (var i in  vesselinfoJson)
		{
			var imo = vesselinfoJson[i].imo;
			var encodedName = encodeShipname(vesselinfoJson[i].name);
			var shipId = vesselinfoJson[i].shipId;
			
			var lonlatMerc = getLonLat(vesselinfoJson[i]).transform(projwgs84,projmerc);
			var iconNr  = getVesselIcon(vesselinfoJson[i]);
			var vesselIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/icon" + iconNr + ".png", new OpenLayers.Size(22,22)) ;
			var groupIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(28, 28));
			groupIcon.offset = new OpenLayers.Pixel(-14, -14);
			
			if(vesselinfoJson[i].groupname)
			{
				addMarker(i, lonlatMerc, groupIcon, false);
			}
			
			addMarker(i, lonlatMerc, vesselIcon, true);
			var vtUrl;
			  if (imo) {vtUrl = "http://www.vesseltracker.com/de/Ships/"+ encodedName + "-" + imo + ".html";}
				 else { vtUrl = "http://www.vesseltracker.com/de/Ships/"+ encodedName +"-I" + shipId + ".html";}
		  	 	  if (vesselinfoJson[i].groupname)
		  		  {		  			  		
		  			  sidebar_html += "<a style='color:#555555; background:#ffff33' href='javascript:"+varname+".opener("+ i + ","+ 1 + ")' ondblclick='window.open(\"" + vtUrl + "\")'>" + encodedName + "(" + vesselinfoJson[i].groupname + ")</a><br/>";
		  		  }
		  		  else
		  		  {
				  	  sidebar_html += "<a style='color:#555555' href='javascript:"+varname+".opener("+ i + ","+ 1 + ")' ondblclick='window.open(\"" + vtUrl + "\")'>" + encodedName + "</a><br/>";		
		  		  }
		}
		document.getElementById(divname_sidebar).innerHTML = sidebar_html;
	}
	
	this.addVessel = function(vesselinfo){
		
		vesselinfoJson = vesselinfo;
		iconLayer.clearMarkers();
		for (var i in vesselinfoJson)
		{
			var imo = vesselinfoJson[i].imo;
			var encodedName = encodeShipname(vesselinfoJson[i].name);
			var shipId = vesselinfoJson[i].shipId;
			
			var lonlatMerc = getLonLat(vesselinfoJson[i]).transform(projwgs84,projmerc);
			var iconNr  = getVesselIcon(vesselinfoJson[i]);
			var vesselIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/icon" + iconNr + ".png", new OpenLayers.Size(iconSize,iconSize)) ;

			var  pointFeature = new OpenLayers.Feature(iconLayer, lonlatMerc,{icon:vesselIcon}); 
		    pointFeature.closeBox = true;
		    var marker = pointFeature.createMarker();
		    if (!vesselinfoJson[i].lat)
		    {
		    	var description = "<html><table><tr><td style='color:red;font-weight: bold;'>No current position.</td></tr><tr><td>Last position received at:</td></tr><tr><td>";
		    	description += vesselinfoJson[i].lastSeen + "</td></tr></table></html>";
		    	pointFeature.data.popupContentHTML = description;
		    	var point_mouseover = function (ev)
				{
					if (this.popup == null)
					{
						this.popup = this.createPopup();
						this.popup.contentSize = new OpenLayers.Size(120,40);
						this.popup.panMapIfOutOfView = true;
						this.popup.autoSize = true;
						map.addPopup(this.popup);
					}
					else
					{
					this.popup.toggle();
					}
				}
				var point_mouseout = function (ev)
				{
					this.popup.toggle();
				}
			marker.events.register("mouseover",pointFeature, point_mouseover);
			marker.events.register("mouseout", pointFeature, point_mouseout);	    
		   }
		    iconLayer.addMarker(marker);
		}
		map.setCenter(lonlatMerc,zoomLevel);
		}
	
	
	/**
	Methode, um auf den Datenbereich eines Layers zu zoomen
	@param layer_name  = icon oder track
	*/
		
	this.zoomToExtent = function()
	{
		map.updateSize();
		if (zoomArea == "track")
		{
			map.zoomToExtent(trackingLineLayer.getDataExtent());
		}
		else if(zoomArea == "icon")
		{
			map.zoomToExtent(iconLayer.getDataExtent());
		}
	}
	
	/**
	Methode, die festlegt, auf den Datenbereich welchen Layers bei zoomToExtent gezoomt wird
	@param layer_name  = icon oder track
	*/
	this.setZoomArea = function(layer_name)
	{
		if (layer_name.toLowerCase() == "icon")
		{
			zoomArea = "icon";
		}
		else if (layer_name.toLowerCase() == "track")
		{
			zoomArea = "track";
		}
	}
	
	this.loadVesselXML = function(regionURL, refresh_interval, ownURL){
		if (regionURL)
		{
		requestURL = regionURL;
		}
		else 
		{
		requestURL = ownURL;
		ownURL = null;
		}
		if(refresh_interval)
		{
			requestInterval = refresh_interval;
			window.setInterval(doLoadXml,refresh_interval);
		}
		if(ownURL)
		{
			ownerURL = ownURL;
			doLoadXml(refreshArray);
		}
		else
		{
			doLoadXml(refreshMap);
		}
	}
	
	this.setIconURL = function(url, s)
	{
		iconURL = url;
		iconSize = (s?s:iconSize);
	}
	
	function addMarker (mmsi, lonlatMerc, icon, addListener) {
		
		var marker = new OpenLayers.Marker(lonlatMerc, icon);
		marker.events.fallThrough = true;  //TODO ist das nötig?
			
		if(addListener){
		var marker_mouseover = function (ev)
			{
				me.opener(mmsi,0);
			};
		marker.events.register("mouseover", marker, marker_mouseover); 
		}
		iconLayer.addMarker(marker);
	}
		
	function doLoadXml(cbMethod)
	{
	var request = OpenLayers.Request.GET({url: requestURL + "?id=" + new Date().getTime(), callback: cbMethod});
	lastReload = new Date().getTime();
	}
	
 	this.zoomOut = function(){
		map.zoomOut();
	}
 	
 	this.setZoomLevel = function(z)
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
	
	/**
	 * @param i index of ship in array vessels
	 * @param p indicates if to pan(center map) to ship (p > 0) or not
	*/
	this.opener = function (i, p) {
		var lonlatMerc = getLonLat(vesselinfoJson[i]).transform(projwgs84,projmerc);
		var vtUrl;
		var imo = vesselinfoJson[i].imo;
        var shipId = vesselinfoJson[i].shipId;
        var encodedName = encodeShipnameForUrl(vesselinfoJson[i].name);
        if (imo) {vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName + "-" + imo + ".html";}
		else { vtUrl = "http://www.vesseltracker.com/de/Ships/"+encodedName+"-I" + shipId + ".html";}
 		
         if ( currentMarker != i)
		{
	        if(specialMarker)
			{
	        	iconLayer.removeMarker(specialMarker);
			}
	        var specialIcon = new OpenLayers.Icon(iconURL, new OpenLayers.Size(iconSize, iconSize));
	        specialMarker = new OpenLayers.Marker(lonlatMerc,specialIcon);
			var dclick = function (ev)
			{
				window.open(vtUrl);
			};
			specialMarker.events.register("dblclick",undefined,dclick);
			specialMarker.events.fallThrough = true;  //TODO ist das nötig?
	        iconLayer.addMarker(specialMarker);
		}
		
		currentMarker = i;
		showInfoCustomer(i);
		
		if(p > 0)
		{
			map.panTo(lonlatMerc);
		}
		}
	 
	 this.getBounds = function() {
		 	if (map.getExtent() != null)
		 	{
			return map.getExtent().transform(projmerc,projwgs84);
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
 	
	function refreshArray(request)
	{
		xmlDoc = request.responseXML;
		markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
		
		refreshedVessels = new Array();
				
		for(var i = 0; i < markerElements.length; i++)
		{
			var vessel = new Object();
			
			vessel.status = markerElements[i].getAttribute("status");
			vessel.name = markerElements[i].getAttribute("name");
			vessel.id = markerElements[i].getAttribute("id");
			vessel.icon = markerElements[i].getAttribute("icon");
			vessel.imo = markerElements[i].getAttribute("imo");
			vessel.mmsi = markerElements[i].getAttribute("mmsi");
			vessel.call = markerElements[i].getAttribute("call");
			vessel.type = markerElements[i].getAttribute("t");
			vessel.th = markerElements[i].getAttribute("th");
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
			vessel.groupname = markerElements[i].getAttribute("groupName");
	
			refreshedVessels[String(vessel.mmsi)] = vessel;
			}
		me.loadVesselXML(ownerURL);
		}
	
	
	function refreshMap (request)
	{
		xmlDoc = request.responseXML;
		markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
		//falls dies kein ownerload infolge eines regionloads ist
		if(!ownerURL )
		{
			refreshedVessels = new Array();
		}
		//stelle sicher, dass beim nächsten Load kein neuer Array erzeugt wird
		else
		{
			ownerURL = null;
		}
		
		for(var i = 0; i < markerElements.length; i++)
		{
			var vessel = new Object();
			
			vessel.status = markerElements[i].getAttribute("status");
			vessel.name = markerElements[i].getAttribute("name");
			vessel.id = markerElements[i].getAttribute("id");
			vessel.icon = markerElements[i].getAttribute("icon");
			vessel.imo = markerElements[i].getAttribute("imo");
			vessel.mmsi = markerElements[i].getAttribute("mmsi");
			vessel.call = markerElements[i].getAttribute("call");
			vessel.type = markerElements[i].getAttribute("t");
			vessel.th = markerElements[i].getAttribute("th");
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
			vessel.groupname = markerElements[i].getAttribute("groupName");
	
			refreshedVessels[String(vessel.mmsi)] = vessel;
		}
		if(zoomLevel) //gesetzt bei gatshipMap small
		{
			me.addVessel(refreshedVessels)
		}
		else
		{
		me.addVesselsCustomer(refreshedVessels);
		}
		if (zoomArea)
		{
			me.zoomToExtent(zoomArea);
		}
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
		if (document.URL.indexOf("smd.de") <= 0)
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

	
	function getControlByName(c_name) 
	{
		if (c_name == "KeyboardDefaults")	return new OpenLayers.Control.KeyboardDefaults();
		if (c_name == "MouseDefaults")	return new OpenLayers.Control.MouseDefaults();
		if (c_name == "Navigation")		return new OpenLayers.Control.Navigation({ zoomWheelEnabled: false });
		if (c_name == "NavigationPlusMouseWheel")		return new OpenLayers.Control.Navigation();
		if (c_name == "LayerSwitcher")	return new OpenLayers.Control.LayerSwitcher();
		if (c_name == "PanZoomBar")		return new OpenLayers.Control.PanZoomBar();
		if (c_name == "MousePosition")	return new OpenLayers.Control.MousePosition();
		if (c_name == "ScaleLine")		return new OpenLayers.Control.ScaleLine();
		if (c_name == "Attribution")	return new OpenLayers.Control.Attribution();
		if (c_name == "PanZoom")	return new OpenLayers.Control.PanZoom();
		
	}
	 
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
// short names of Ship owners the should not be rendered MixedCase
var ABBREVS = new Array(
	 "MV.","CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
	 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
	 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
	 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
	 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
	 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
	 "II", "III", "IV", "VI", "VII"); // roemische zahlen

}

